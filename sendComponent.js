const console = require('util');

module.exports = (name, component) => (value, respond) => {
	if (component instanceof Function) {
		component = component.toString();
	}

	let data = name === 'data' ? component.pop(value) : component;

	console.log(`Sending ${name}`);
	respond(data);
};
