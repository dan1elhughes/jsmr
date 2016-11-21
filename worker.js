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

let store = value => {
	if (value.fn) {
		value.fn = value.fn.replace(/\s\s+/g, ' ');
	}

	console.log(`STOR: ${JSON.stringify(value)}`);

	components.fn = value.fn;
	components.data = value.data;

	if (components.data && components.fn) {
		execute();
	}
};

let execute = () => {
	components.data.forEach(data => {
		if (data !== null) {
			let context = vm.createContext({
				console,
				data
			});

			console.log(`PROC: ${data}`);
			let result = vm.runInContext(`((${components.fn})(data))`, context);

			if (typeof result !== 'undefined') {
				socket.emit(`result`, result);
			}
		} else {
			components.DONE = true;
		}
	});

	if (!components.DONE) {
		socket.emit(`get-chunk`, components.CHUNKSIZE++, store);
	}
};

socket.on('disconnect', () => console.log('DISC: Disconnected'));

socket.on('connect', () => {
	console.log('CONN: Connected');

	resetComponents();

	socket.emit('get-chunk', components.CHUNKSIZE++, store);
});
