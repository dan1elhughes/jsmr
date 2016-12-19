const server = require('http').createServer();
const p2p = require('socket.io').listen(server);
const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', { reconnect: true });
const console = require('util');
const processInVM = require('./processInVM');

let serverMeta;

let memory = [];
let resetMemory = () => memory = [];

let CHUNKSIZE = 1;
let resetScaling = () => CHUNKSIZE = 1;
let increaseScaling = () => CHUNKSIZE++;

let store = value => {
	console.log(`STOR: ${JSON.stringify(value)}`);

	let components = {
		action: value.action,
		data: value.data,
		fn: value.fn.replace(/\s\s+/g, ' '),
	};

	if (components.data && components.fn) {
		if (components.action === 'map') {
			map({
				data: components.data,
				fn: components.fn,
			});
		} else if (components.action === 'reduce') {
			reduce({
				data: components.data,
				fn: components.fn,
			});
		} else if (components.action === 'done') {
			console.log(`No more work.`);
			// process.exit(0);
		}
	}
};

let execute = components => {

	let { action, data, fn } = components;

	let process = data => {
		let context = vm.createContext({
			console,
			data
		});

		console.log(`PROC: ${JSON.stringify(data)}`);
		let result = vm.runInContext(`((${fn})(data))`, context);

		if (typeof result !== 'undefined') {

			let content = {
				action: action
			};

			if (action === 'reduce') {
				content.result = {
					key: data[0].key,
					value: result
				};
			} else {
				content.result = result;
			}

			let memKey = `${action}/${content.result.key}`;

			memory.push({
				k: memKey,
				v: content.result
			});

			socket.emit('p2p-haveKey', memKey);
		}
	};

	if (action === 'map') {
		data.forEach(process);
let getRemoteValue = (host, key) => new Promise(resolve => {
	if (host.address === serverMeta.address && host.port === serverMeta.port) {
		resolve(memory
			.filter(item => item.k === key)
			.map(item => item.v)
		);
	} else {
		network.connect(`http://${host.address}:${host.port}`).emit('kvs-get', key, values => {
			resolve(values.map(value => value.v));
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

	let { data, fn } = components;

	data.forEach(chunk => {
		let { key, hosts } = chunk;

		getRemoteValues({ key, hosts }).then(values => {
			values = [].concat.apply([], values);
			let result = processInVM(fn, values);
			socket.emit('result', { key: `reduce/${key.split('/')[1]}`, action: 'reduce', result });
		});
	})

	socket.emit(`get-chunk`, increaseScaling(), store);
};

socket.on('disconnect', () => {
	resetMemory();
	resetScaling();
	console.log('DISC: Disconnected');
});

socket.on('connect', () => {
	console.log('CONN: Connected');
	server.listen(0, '127.0.0.1');

	resetMemory();
	resetScaling();

	socket.emit('get-chunk', increaseScaling(), store);
});

p2p.on('connection', socket => {
	socket.on('kvs-get', (keys, respond) => {
		respond(memory.filter(item => keys.includes(item.v.key)));
	});
});

server.on('listening', () => {
	serverMeta = server.address();
	socket.emit('p2p-register', serverMeta);
});
