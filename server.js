const server = require('http').createServer();
const network = require('socket.io').listen(server);
const sendComponents = require('./sendComponents');

const words = require('./wordcount/load')();

network.on('connection', socket => {

	socket.on('ready', machine => {
		console.log(`READY: ${socket.id} (${machine.hostname})`);

		sendComponents(socket, {
			data: words,
			process: function () {
				console.log(this.data);
				this.data.forEach(sentence => {
					let words = sentence.split(' ').filter(Boolean);
					if (words.length) {
						emit(words.length);
					}
				});
			}
		}).then(function () {
			console.log('done');
		});
	});

	socket.on('disconnect', () => {
		console.log(`DISCONN: ${socket.id}`);
	});

	socket.on('result', result => console.log(`RESULT:  ${result}`));
});

setInterval(() => {
	network.clients((error, clients) => {
		if (error) throw error;
		console.log(clients);
	});

	network.emit('doWork');
}, 3000);

server.on('listening', () => console.log('Listening'));
server.listen(3000);
