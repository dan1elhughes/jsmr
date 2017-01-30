const server = require('http').createServer();
const network = require('socket.io').listen(server);
const console = require('util');
const sendComponent = require('./sendComponent');
const app = require('./wordcount/app');
const Queue = require('./Queue');
const P2P = require('./p2p');
const { print, CLEAR, REWRITEABLE } = require('./debug');

let log = print(app.debug.print);

let mapQueue = new Queue();
let reduceQueue = new Queue();
let results = [];

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
		reduce: app.reduce,
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
			console.log(`MAPR: ${JSON.stringify(data)}`);

			reduceQueue.push(data);
			p2p.hasKey(socket.id)(data.key);
			p2p.registerBackup(socket.id)(data);

		} else if (data.action === 'reduce') {
			console.log(`RDCE: ${JSON.stringify(data)}`);
			data.results.forEach(result => {
				if (app.filter(result)) {
					results.push({
						key: result.key.split('/')[1],
						value: result.value
					});
				}
			});
			if (reduceQueue.length() === 0) {
				app.write(app.aggregate(results)).then(() => {
					process.exit(0);
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

server.on('listening', () => console.log('Listening'));
server.listen(3000, '127.0.0.1');
