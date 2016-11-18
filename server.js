const server = require('http').createServer();
const network = require('socket.io').listen(server);
const console = require('util');
const sendComponent = require('./sendComponent');
const app = require('./wordcount/app');
const Queue = require('./Queue');

let toMap = new Queue(app.partition(app.load()));
let mapped = new Queue();

network.on('connection', socket => {

	console.log(`CONN: ${socket.id}`);

	socket.on('get-fn', sendComponent('fn', app.map));
	socket.on('get-data', sendComponent('data', toMap));

	socket.on('disconnect', () => console.log(`DISCONN: ${socket.id}`));

	socket.on('result', mapped.push);
});

server.on('listening', () => console.log('Listening'));
server.listen(3000);
