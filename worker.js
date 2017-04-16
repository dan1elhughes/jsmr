const server = require('http').createServer();
const p2p = require('socket.io').listen(server);
const network = require('socket.io-client');
const processInVM = require('./processInVM');
const { print, CLEAR, REWRITEABLE, FORCE } = require('./debug');
let log = print(true);
require('dotenv').config();

const getIP = require('./getIP');
const MY_IP = getIP();

const CONTROLLER_PORT = process.env.CONTROLLER_PORT || 33000;
const CONTROLLER_IP = process.env.CONTROLLER_IP || '127.0.0.1';

const socket = network.connect(`http://${CONTROLLER_IP}:${CONTROLLER_PORT}`, {
	reconnect: true,
	timeout: 2000,
});
socket.io.backoff.factor = 1;
socket.io.backoff.jitter = 0;
socket.io.backoff.ms = 1000;

log(`CONN`, `Connecting to ${CONTROLLER_IP}:${CONTROLLER_PORT}`);
socket.on('reconnect_attempt', (n) => {
	log(`CONN`, `Connecting to ${CONTROLLER_IP}:${CONTROLLER_PORT} (Retry ${n})`);
});

let serverMeta;

let memory = new Map();
let backups = [];
let resetMemory = () => memory = new Map();
let resetBackups = () => backups = [];

let CHUNKSIZE = 1;
let IDEAL_TIME = 500;
let resetScaling = () => CHUNKSIZE = 1;
let increaseScaling = () => CHUNKSIZE += 1;
let decreaseScaling = () => CHUNKSIZE -= 1;

let store = value => {
	log = print(value.debug.print);

	if (value.ideal_time) {
		IDEAL_TIME = value.ideal_time;
	}

	let components = {
		action: value.action,
		data: value.data,
		fn: value.fn.replace(/\s\s+/g, ' '),
		debug: value.debug,
		backups: value.backups,
	};

	if (components.data && components.fn) {
		if (components.action === 'map') {
			map({
				data: components.data,
				fn: components.fn,
				debug: components.debug,
			});
		} else if (components.action === 'reduce') {
			reduce({
				data: components.data,
				fn: components.fn,
				debug: components.debug,
			});
		} else if (components.action === 'done') {
			// console.log(`No more work.`);
		}
	}

	if (components.backups.length > 0) {
		fetchBackups(components.backups);
	}
};

let fetchBackup = ({ key, host}) => new Promise(resolve => {
	network.connect(`http://${host.address}:${host.port}`).emit('kvs-get', key, values => {
		resolve(values.map(value => ({
			key: value.k,
			value: value.v.value
		})));
	});
});

let fetchBackups = keys => {
	Promise.all(keys.map(fetchBackup)).then(values => {
		values = [].concat.apply([], values);
		backups = backups.concat(values);

		// console.log(values);
	});
};

let map = components => {

	let { data: dataArr, fn, debug } = components;

	if (dataArr.length === 1) {
		resetScaling();
	}

	let combine;

	if (fn.indexOf('/|/') > -1) {
		[ fn, combine ] = fn.split('/|/');
	}

	let results = [];

	let start = new Date();

	dataArr.forEach((data, i) => {
		log('MAPR', `${i+1} of ${dataArr.length} (${JSON.stringify(data)})`, REWRITEABLE);
		let result = processInVM(fn, data);

		if (typeof result !== 'undefined') {
			if (Array.isArray(result)) {
				result.forEach(r => {
					results.push({
						key: r.key,
						value: r.value
					});
				});
			}
			results.push({
				key: result.key,
				value: result.value
			});
		}
	});

	if (combine) {
		results.forEach(result => {

			let existing = memory.get(result.key) || [];

			let arr = existing.concat(result.value);

			let toCombine = arr.map(value => ({
				key: result.key,
				value: value
			}));

			let combined = processInVM(combine, toCombine);

			memory.set(result.key, [ combined ]);
		});
	} else {
		results.forEach(result => {
			let existing = memory.get(result.key) || [];
			existing.push(result.value);
			memory.set(result.key, existing);
		});
	}

	log(CLEAR); // Blank line to indicate map has finished
	socket.emit('result', {
		action: 'map',
		keys: results.map(result => result.key)
	});

	let getMore = () => socket.emit(`get-chunk`, CHUNKSIZE, store);

	let timeTaken = new Date() - start;

	if (timeTaken > IDEAL_TIME) {
		decreaseScaling();
	} else {
		increaseScaling();
	}

	if (debug.slow) {
		setTimeout(getMore, debug.slow);
	} else {
		getMore();
	}

};

let socketPool = {};
let connectToPeer = uri => new Promise(resolve => {
	if (socketPool[uri]) {
		// log(`P2P `, `Reusing connection to ${uri}`);
		return resolve(socketPool[uri]);
	}

	socketPool[uri] = new Promise(resolve => {
		log(`P2P `, `Initialising connection to ${uri}`);

		let socket = network.connect(uri, {
			reconnect: true,
			timeout: 1000,
		});

		socket.io.backoff.factor = 1;
		socket.io.backoff.jitter = 0;
		socket.io.backoff.ms = 0;

		socket.on('reconnect_attempt', n => {
			log(`CONN`, `Connecting to ${uri} (Retry ${n})`);
			if (n > 10) {
				log(`CONN`, `Unable to connect! Abandoning...`);
				socket.disconnect();
			}
		});

		socket.on('connect', () => {
			socket.emit('_ping', response => {
				if (response === '_pong') {
					resolve(socket);
				}
			})
		});
	});

	return resolve(socketPool[uri]);
});

let getRemoteValues = data => new Promise(resolve => {
	let keys = {};

	data.forEach(item => {
		item.hosts.forEach(host => {
			let uri = `http://${host.address}:${host.port}`;

			if (!keys[uri]) {
				keys[uri] = [];
			}

			keys[uri].push(item.key);
		});
	});

	let results = [];

	for (let host in keys) {
		if (host === serverMeta.uri) {
			keys[host].forEach(key => {
				let known = memory.get(key);

				known.forEach(value => {
					results.push(Promise.resolve({ key, value }));
				})
			});

			continue;
		}

		results.push(new Promise(resolve => {
			connectToPeer(host).then((socket) => {
				log(`KSVR`, `Requesting ${keys[host].join(',')} from ${host}`);
				socket.emit('kvs-get', keys[host], (values) => {
					resolve(values);
				});
			});
		}));
	}

	return resolve(Promise.all(results));
});

let reduce = components => {

	log('RDCE', `Got ${components.data.length} keys (${components.data.map(_ => _.key).join(',')})`);
	let { data, fn } = components;

	getRemoteValues(data).then(values => {
		values = [].concat.apply([], values); // Converts a nested array into a flat array

		let sets = {};

		values.forEach(entry => {

			if (!sets[entry.key]) {
				sets[entry.key] = []
			}

			sets[entry.key].push(entry)
		});

		let results = [];
		let i = 0;

		for (let key in sets) {
			let value = processInVM(fn, sets[key]);

			results.push({ key, value });

			log('RDCE', `${++i} of ${Object.keys(sets).length} (${key} => ${JSON.stringify(value)})`, REWRITEABLE);
		}

		let done = () => {
			socket.emit('result', { action: 'reduce', results });
			socket.emit(`get-chunk`, CHUNKSIZE, store);
		}

		if (components.debug.slow) {
			setTimeout(done, components.debug.slow * i);
		} else {
			done();
		}
	});

};

socket.on('disconnect', () => {
	resetMemory();
	resetBackups();
	resetScaling();

	log('DISC', 'Disconnected', FORCE);
});

socket.on('connect', () => {
	log('CONN', 'Connected', FORCE);
	server.listen(0, '0.0.0.0');

	resetMemory();
	resetBackups();
	resetScaling();

	socket.emit('get-chunk', CHUNKSIZE, store);
});

p2p.on('connection', socket => {

	socket.on('_ping', respond => respond(`_pong`));

	socket.on('kvs-get', (keys, respond) => {
		let result = [];

		keys.forEach(key => {
			let known = memory.get(key);

			known.forEach(value => {
				result.push({ key, value });
			})
		});

		log(`KSVG`, `Responding to request for ${JSON.stringify(keys)} (${result.length} values)`);
		respond(result);
	});

	socket.on('kvs-get-backup', (key, respond) => {
		respond(backups.filter(item => item.key === key));
	});

});

server.on('listening', () => {
	serverMeta = server.address();
	serverMeta.uri = `http://${MY_IP}:${serverMeta.port}`;

	socket.emit('p2p-register', {
		address: MY_IP,
		port: serverMeta.port
	});
});
