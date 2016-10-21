const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', {
	reconnect: true
});
const os = require('os');
const vm = require('vm');
const console = require('util');

socket.on('disconnect', () => console.log('Disconnected'));
socket.on('connect', () => console.log('Connected'));

socket.emit('ready', {
	hostname: os.hostname()
});

let components = {};

socket.on('data', incoming => components.data = incoming);
socket.on('process', incoming => components.process = `((${incoming})())`);

socket.on('doWork', () => {
	let context = vm.createContext({
		console,
		data: components.data,
		emit: data => socket.emit('result', data)
	});

	vm.runInContext(components.process, context);
});
