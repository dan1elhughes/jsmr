const server = require('http').createServer();
const network = require('socket.io').listen(server);
const console = require('util');
const sendComponent = require('./sendComponent');
const app = require('./wordcount/app');
const Queue = require('./Queue');

let mapQueue = new Queue(app.partition(app.load()));
let reduceQueue = new Queue();

network.on('connection', socket => {

	console.log(`CONN: ${socket.id}`);

	socket.on('get-chunk', sendComponent('chunk', {
		map: app.map,
		reduce: app.reduce,
		mapQueue,
		reduceQueue
	}));

	socket.on('disconnect', () => console.log(`DSCN: ${socket.id}`));

	socket.on('result', data => {
		if (data.action === 'map') {
			reduceQueue.push(data.result);
			console.log(`MAPR: ${JSON.stringify(data)}`);
		} else if (data.action === 'reduce') {
			console.log(`RDCE: ${JSON.stringify(data)}`);
		} else {
			console.log(`????: ${JSON.stringify(data)}`);
		}
	});
});

server.on('listening', () => console.log('Listening'));
server.listen(3000);
