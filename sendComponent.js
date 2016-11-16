const console = require('util');

module.exports = (name, component) => (quantity, respond) => {
	if (component instanceof Function) {
		component = component.toString();
	}

	let data = name === 'data' ? component.pop(quantity) : component;

	console.log(`Sending ${name}`);
	respond(data);
};
