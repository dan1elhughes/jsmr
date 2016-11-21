const console = require('util');

module.exports = (name, components) => (quantity, respond) => {
	console.log(`SEND: ${name}`);

	let { mapQueue, reduceQueue, map, reduce } = components;

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
		fn = () => {};
		data = [];
		action = 'done';
	}

	respond({
		action,
		data,
		fn,
	});
};
