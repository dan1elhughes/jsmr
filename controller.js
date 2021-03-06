// Load environment variables
require('dotenv').config();
const application = process.env.APP || 'wordcount';

const server = require('http').createServer();
const network = require('socket.io').listen(server);
const console = require('util');
const sendComponent = require('./sendComponent');
const Queue = require('./Queue');
const P2P = require('./p2p');
const { print, CLEAR, REWRITEABLE } = require('./debug');

let app;
try {
	app = require(`./${application}/app`);
} catch (e) {
	console.log(`INIT: application { /${application}/app.js } not found`);
	process.exit(1);
}
console.log(`INIT: application { /${application}/app.js }`);

let port = process.env.CONTROLLER_PORT || 33000;

let log = print(app.debug.print);

let mapQueue = new Queue();
let reduceQueue = new Queue();
let results = [];

let startTime = new Date();

app.load().on('data', chunk => {
	let data = app.transform ? app.transform(chunk) : chunk;
	mapQueue.concat(data);
});

if (typeof app.filter === 'undefined') {
	app.filter = () => true;
}

let p2p = new P2P();

network.on('connection', socket => {

	console.log(`CONN: ${socket.id}`);

	socket.on('get-chunk', sendComponent({
		map: app.map,
		combine: app.combine,
		reduce: app.reduce,
		ideal_time: app.ideal_time,
		mapQueue,
		reduceQueue,
		socket: socket.id,
		p2p,
		debug: app.debug
	}));

	socket.on('disconnect', () => {
		console.log(`DSCN: ${socket.id}`);
		p2p.unregister(socket.id);
	});

	socket.on('result', data => {
		if (data.action === 'map') {

			console.log(`MAPR: Got ${data.keys.length} keys`);
			data.keys.forEach(key => {
				reduceQueue.push({ key });
				p2p.hasKey(socket.id)(key);
				// p2p.registerBackup(socket.id)(key);
			});

		} else if (data.action === 'reduce') {
			console.log(`RDCE: Got ${data.results.length} results`);
			data.results.forEach(result => {

				results.forEach(r => {
					if (r.key === result.key) {
						console.log(`Overwriting key (${result.key})`);
						r._remove = true;
					}
				});

				results = results.filter(r => !r._remove);

				if (app.filter(result)) {
					results.push(result);
				}
			});

			// BUG: If there are nodes currently working on
			// reduces, this returns true and the results
			// are written twice: once this time round,
			// and again when those nodes finish their
			// work.
			if (reduceQueue.length() === 0) {

				let output = results;

				if (app.aggregate) {
					output = app.aggregate(output);
				}

				app.write(output).then(() => {
					console.log('Written');
					console.log((new Date() - startTime) / 1000);
					// process.exit(0);
				});
			}
		}
	});

	socket.on('p2p-register', p2p.register(socket.id));

	socket.on('kvs-find', (keys, respond) => {
		respond(keys.map(key => ({
			key,
			hosts: p2p.findHostsWith(key, socket.id)
		})).filter(connection => connection.hosts.length > 0));
	});
});

server.on('listening', () => console.log(`Listening at ${port}`));
server.listen(port, '0.0.0.0');
