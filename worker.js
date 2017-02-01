const server = require('http').createServer();
const p2p = require('socket.io').listen(server);
const network = require('socket.io-client');
const processInVM = require('./processInVM');
const { print, CLEAR, REWRITEABLE, FORCE } = require('./debug');
require('dotenv').config();

const getIP = require('./getIP');
const MY_IP = getIP();

const CONTROLLER_PORT = process.env.CONTROLLER_PORT || 33000;
const CONTROLLER_IP = process.env.CONTROLLER_IP || '127.0.0.1';
const socket = network.connect(`http://${CONTROLLER_IP}:${CONTROLLER_PORT}`, { reconnect: true });
console.log(`Connecting to http://${CONTROLLER_IP}:${CONTROLLER_PORT}`);

let serverMeta;

let memory = [];
let backups = [];
let resetMemory = () => memory = [];
let resetBackups = () => backups = [];

let CHUNKSIZE = 1;
let resetScaling = () => CHUNKSIZE = 1;
let increaseScaling = () => CHUNKSIZE++;
let log = print(true);

let store = value => {
	log = print(value.debug.print);

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

	let results = [];

	dataArr.forEach((data, i) => {
		let output = () => {
			log('MAPR', `${i+1} of ${dataArr.length} (${data})`, REWRITEABLE);
			let result = processInVM(fn, data);

			if (typeof result !== 'undefined') {
				results.push({
					key: result.key,
					value: result.value
				});
			}

			if (results.length === dataArr.length) {

				memory = memory.concat(results);

				log(CLEAR); // Blank line to indicate map has finished
				socket.emit('result', {
					action: 'map',
					keys: results.map(result => result.key)
				});

				socket.emit(`get-chunk`, increaseScaling(), store);
			}
		};

		if (debug.slow) {
			setTimeout(output, debug.slow * i);
		} else {
			output();
		}
	});

};

let getRemoteValue = (host, key) => new Promise(resolve => {
	if (host.address === MY_IP && host.port === serverMeta.port) {
		resolve(memory.filter(item => item.key === key));
	} else {
		log(`GRMV`, `Requesting ${key} from ${host.address}:${host.port}`);
		network.connect(`http://${host.address}:${host.port}`).emit('kvs-get', key, value => {
			log(`GRMV`, `Got ${key} from ${host.address}:${host.port}`);
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

let reduce = components => {

	log('RDCE', `Got ${components.data.length} keys`);
	let { data, fn } = components;

	let results = [];

	data.forEach(chunk => {
		let { key, hosts } = chunk;

		log('RDCE', `Processing ${key}`);

		getRemoteValues({ key, hosts }).then(values => {
			values = [].concat.apply([], values); // Converts a nested array into a flat array

			log('RDCE', key, REWRITEABLE);
			let value = processInVM(fn, values);
			log('RDCE' , `${key} => ${value}`);

			results.push({ key, value });

			if (results.length === data.length) {

				let output = () => {
					socket.emit('result', { action: 'reduce', results });
					socket.emit(`get-chunk`, increaseScaling(), store);
				};

				if (components.debug.slow) {
					setTimeout(output, components.debug.slow);
				} else {
					output();
				}
			}
		});
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

	socket.emit('get-chunk', increaseScaling(), store);
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
