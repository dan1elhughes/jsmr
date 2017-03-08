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

let memory = [];
let backups = [];
let resetMemory = () => memory = [];
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
			let existingResults = [];
			memory = memory.filter(item => {
				if (item.key === result.key) {
					existingResults.push(item);
					return false;
				} else {
					return true;
				}
			});

			let arr = existingResults.concat(result);
			let value = processInVM(combine, arr);
			memory.push({
				key: result.key,
				value
			});
		});
	} else {
		memory = memory.concat(results);
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

let getRemoteValue = (host, key) => new Promise(resolve => {
	if (host.address === MY_IP && host.port === serverMeta.port) {
		resolve(memory.filter(item => item.key === key));
	} else {
		log(`GRMV`, `Requesting ${key} from ${host.address}:${host.port}`);

		let p2psocket = network.connect(`http://${host.address}:${host.port}`, {
			reconnect: true,
			timeout: 1000,
		});
		p2psocket.io.backoff.factor = 1;
		p2psocket.io.backoff.jitter = 0;
		p2psocket.io.backoff.ms = 0;

		p2psocket.on('reconnect_attempt', (n) => {
			// BUG These sockets remain alive and trying to connect. Store map of connections and re-use
			log(`CONN`, `Connecting to ${host.address}:${host.port} (Retry ${n})`);
		});

		p2psocket.emit('kvs-get', key, value => {
			log(`GRMV`, `Got ${key} from ${host.address}:${host.port}`);
			p2psocket.disconnect();
			return resolve(value);
		});
	}
});

// POSSIBLE BUG:
// If one node finishes before another and requests
// a find on a key, it won't get map results for
// the second node. Fix may be to wait for all
// maps to finish before sending out any reduce
// instructions, or change shuffle to a push model.
let getRemoteValues = ({ key, hosts }) => Promise.all(
	hosts.map(
		host => getRemoteValue(host, key)
	)
);

let firstReduce = true;
let reduce = components => {

	if (firstReduce) {
		resetScaling();
		firstReduce = false;
	}

	log('RDCE', `Got ${components.data.length} keys`);
	let { data, fn } = components;

	let results = [];

	let start = new Date();

	data.forEach((chunk, i) => {
		let output = () => {

			let { key, hosts } = chunk;

			getRemoteValues({ key, hosts }).then(values => {
				values = [].concat.apply([], values); // Converts a nested array into a flat array

				let value = processInVM(fn, values);
				results.push({ key, value });

				log('RDCE', `${i+1} of ${components.data.length} (${key} => ${value})`, REWRITEABLE);

				if (results.length === data.length) {

					log(CLEAR);

					socket.emit('result', { action: 'reduce', results });
					socket.emit(`get-chunk`, CHUNKSIZE, store);

					// BUG: Scale this properly
					let timeTaken = new Date() - start;

					if (timeTaken > IDEAL_TIME) {
						decreaseScaling();
					} else {
						increaseScaling();
					}
				}
			});
		};

		if (components.debug.slow) {
			setTimeout(output, components.debug.slow * i);
		} else {
			output();
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
	socket.on('kvs-get', (key, respond) => {
		let result = memory.filter(item => item.key === key);
		log(`KSVG`, `Responding to request for ${key}: ${JSON.stringify(result)}`);
		respond(result);
		socket.disconnect();
	});
	socket.on('kvs-get-backup', (key, respond) => {
		respond(backups.filter(item => item.key === key));
	});
});

server.on('listening', () => {
	serverMeta = server.address();

	socket.emit('p2p-register', {
		address: MY_IP,
		port: serverMeta.port
	});
});
