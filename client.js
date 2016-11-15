const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', { reconnect: true });
const os = require('os');
const vm = require('vm');
const console = require('util');

let components = {};

const execute = process => () => {
	let context = vm.createContext({
		console,
		data: components.data,
		emit: data => socket.emit(`result-${process}`, data)
	});

	let result = vm.runInContext(components[process], context);
	if (result) {
		socket.emit(`result-${process}`, result);
	}
};

socket.on('disconnect', () => console.log('Disconnected'));
socket.on('connect', () => console.log('Connected'));

socket.emit('ready', {
	hostname: os.hostname()
});

socket.on('data', incoming => components.data = incoming);

socket.on('map', incoming => components.map = `((${incoming})())`);
socket.on('exec-map', execute('map'));

socket.on('reduce', incoming => components.reduce = `((${incoming})())`);
socket.on('exec-reduce', execute('reduce'));
