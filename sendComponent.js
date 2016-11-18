const console = require('util');

module.exports = (name, component) => (quantity, respond) => {
	console.log(`SEND: ${name}`);
	respond({
		fn: component.fn.toString(),
		data: component.data.pop(quantity)
	});
};
