const network = require('socket.io-client');
const socket = network.connect('http://localhost:3000', { reconnect: true });
const vm = require('vm');
const console = require('util');

let components = {};

let resetComponents = () => {
	components = {
		DONE: false,
		CHUNKSIZE: 1
	};
};

let store = key => value => {
	console.log(`STORE ${key}: `, value);
	components[key] = value;

	if (components.data && components.fn && !components.DONE) {
		execute();
	}
};

const execute = () => {
	components.data.forEach(data => {
		if (data !== null) {
			let context = vm.createContext({
				console,
				data
			});

			let result = vm.runInContext(`((${components.fn})(data))`, context);

			if (typeof result !== 'undefined') {
				socket.emit(`result`, result);
			}
		} else {
			components.DONE = true;
		}
	});

	if (!components.DONE) {
		socket.emit(`get-data`, components.CHUNKSIZE++, store('data'));
	}
};

socket.on('disconnect', () => console.log('Disconnected'));

socket.on('connect', () => {
	console.log('Connected');

	resetComponents();

	socket.emit('get-data', components.CHUNKSIZE++, store('data'));
	socket.emit('get-fn', null, store('fn'));
});
