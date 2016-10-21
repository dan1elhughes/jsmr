const server = require('http').createServer();
const network = require('socket.io').listen(server);

network.on('connection', socket => {

	socket.on('ready', machine => {
		console.log(`CONNECT: ${socket.id} (${machine.hostname})`);
	});

	socket.on('disconnect', () => {
		console.log(`DISCONN: ${socket.id}`);
	});

	socket.on('result', console.log);
});

var map = function () {
	this.result = 'some result';
};

var payload = map.toString();

setInterval(() => {
	network.emit('something', payload);

	network.clients((error, clients) => {
		if (error) throw error;
		console.log(clients);
	});

}, 5000);

server.on('listening', () => console.log('Listening'));
server.listen(3000);
