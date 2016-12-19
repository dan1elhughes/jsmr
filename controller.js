const server = require('http').createServer();
const network = require('socket.io').listen(server);
const console = require('util');
const sendComponent = require('./sendComponent');
const app = require('./wordcount/app');
const Queue = require('./Queue');
const P2P = require('./p2p');

let mapQueue = new Queue(app.partition(app.load()));
let reduceQueue = new Queue();

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

		} else if (data.action === 'reduce') {
			console.log(`RDCE: ${JSON.stringify(data)}`);

		} else {
			console.log(`????: ${JSON.stringify(data)}`);

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
