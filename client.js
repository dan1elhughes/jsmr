const io = require('socket.io-client');
const socket = io.connect('http://localhost:3000', {
	reconnect: true
});
const os = require('os');
const vm = require('vm');

socket.on('disconnect', () => console.log('Disconnected'));
socket.on('connect', () => console.log('Connected'));

socket.emit('ready', {
	hostname: os.hostname()
});

socket.on('something', function (map) {
	var sandbox = {};
	var context = vm.createContext(sandbox);
	vm.runInContext(`(${map}())`, context);
	socket.emit('result', context);
	console.log(context);
});
