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

	components.action = value.action;
	components.data = value.data;
	components.fn = value.fn;

	if (components.data && components.fn && components.action !== 'done') {
		execute();
	}
};

let execute = () => {

	let process = data => {
		if (data !== null) {
			let context = vm.createContext({
				console,
				data
			});

			console.log(`PROC: ${JSON.stringify(data)}`);
			let result = vm.runInContext(`((${components.fn})(data))`, context);

			if (typeof result !== 'undefined') {

				let content = {
					action: components.action
				};

				if (components.action === 'reduce') {
					content.result = {
						key: components.data[0].key,
						value: result
					};
				} else {
					content.result = result;
				}

				socket.emit(`result`, content);
			}
		} else {
			components.DONE = true;
		}
	};

	if (components.action === 'map') {
		components.data.forEach(process);
	} else {
		process(components.data);
	}

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
