const console = require('util');

module.exports = (components) => (quantity, respond) => {

	let { socket, mapQueue, reduceQueue, map, reduce } = components;

	console.log(`SEND: ${socket}`);

	let fn, data, action;

	if (mapQueue.length() > 0) {
		fn = map.toString();
		data = mapQueue.pop(quantity);
		action = 'map';
	} else if (reduceQueue.length() > 0) {
		fn = reduce.toString();
		data = reduceQueue.accumulate();
		action = 'reduce';
	} else {
		fn = (() => {}).toString();
		data = [];
		action = 'find';
	}

	respond({
		action,
		data,
		fn,
	});
};
