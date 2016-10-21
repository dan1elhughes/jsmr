const server = require('http').createServer();
const io = require('socket.io').listen(server);

io.on('connection', socket => {

	socket.on('ready', machine => {
		console.log(`CONNECT: ${socket.id} (${machine.hostname})`);
	});

	socket.on('disconnect', () => {
		console.log(`DISCONN: ${socket.id}`);
	});
});

setInterval(() => {
	io.emit('something', 'Event to all clients');

	io.clients((error, clients) => {
		if (error) throw error;
		console.log(clients);
	});

}, 5000);

server.on('listening', () => console.log('Listening'));
server.listen(3000);
