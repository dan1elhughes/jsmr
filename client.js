const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', { reconnect: true });
const vm = require('vm');
const console = require('util');

let components = {
	DONE: false
};

let store = key => value => {
	console.log(`Got ${key}: `, value);
	components[key] = value;

	if (components.data && components.fn && !components.DONE) {
		execute('fn')();
	}
};

const execute = process => () => {
	console.log(`EXEC: ${process}`);

	let runAndTransmit = data => {

		if (data !== null) {
			let context = vm.createContext({
				console,
				data,
				emit: data => socket.emit(`result`, data)
			});

			let result = vm.runInContext(`((${components[process]})(data))`, context);

			if (result) {
				socket.emit(`result`, result);
			}
		} else {
			components.DONE = true;
		}
	};

	components.data.forEach(runAndTransmit);

	if (!components.DONE) {
		socket.emit(`get-data`, 3, store('data'));
	}
};

socket.on('disconnect', () => console.log('Disconnected'));

socket.on('connect', () => {
	console.log('Connected');

	store('data')(null);
	socket.emit('get-data', 1, store('data'));
	socket.emit('get-fn', null, store('fn'));
});
