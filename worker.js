const server = require('http').createServer();
const p2p = require('socket.io').listen(server);
const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', { reconnect: true });
const processInVM = require('./processInVM');
const { print, CLEAR, REWRITEABLE } = require('./debug');

let serverMeta;

let memory = [];
let resetMemory = () => memory = [];

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
};

let map = components => {

	let { data: dataArr, fn, debug } = components;

	let length = dataArr.length;
	let done = 0;

	dataArr.forEach((data, i) => {
		let output = () => {
			log('MAP', `${i+1} of ${length} (${data})`, REWRITEABLE);
			let result = processInVM(fn, data);

			if (typeof result !== 'undefined') {
				let key = `map/${result.key}`;

				memory.push({
					k: key,
					v: result
				});

				socket.emit('result', { key, action: 'map' });
			} else {
				console.log(`WARN: Got undefined processing ${data}`);
			}

			if (++done === length) {
				log(CLEAR); // Blank line to indicate map has finished
				socket.emit(`get-chunk`, increaseScaling(), store);
			}
		};

		if (debug.slow) {
			setTimeout(output, 250 * i);
		} else {
			output();
		}
	});

};

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

	log('RDCE', `Got ${components.data.length} keys`);
	let { data, fn } = components;

	let length = data.length;
	let done = 0;

	let results = [];

	data.forEach(chunk => {
		let { key, hosts } = chunk;

		getRemoteValues({ key, hosts }).then(values => {
			key = key.split('/')[1];
			values = [].concat.apply([], values); // Converts a nested array into a flat array

			log('RDCE', key, REWRITEABLE);
			let value = processInVM(fn, values);
			log('RDCE' , `${key} => ${value}`);

			results.push({ key: `reduce/${key}`, value });

			if (++done === length) {
				socket.emit('result', { action: 'reduce', results });
				socket.emit(`get-chunk`, increaseScaling(), store);
			}
		});
	});
};

socket.on('disconnect', () => {
	resetMemory();
	resetScaling();
	log('DISC', 'Disconnected');
});

socket.on('connect', () => {
	log('CONN', 'Connected');
	server.listen(0, '127.0.0.1');

	resetMemory();
	resetScaling();

	socket.emit('get-chunk', increaseScaling(), store);
});

p2p.on('connection', socket => {
	socket.on('kvs-get', (key, respond) => {
		respond(memory.filter(item => item.k === key));
	});
});

server.on('listening', () => {
	serverMeta = server.address();
	socket.emit('p2p-register', serverMeta);
});
