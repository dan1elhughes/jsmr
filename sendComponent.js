const console = require('util');

module.exports = (components) => (quantity, respond) => {

	let { map, reduce, mapQueue, reduceQueue, socket, p2p } = components;

	console.log(`SEND: ${socket} (${quantity})`);

	let fn, data, action;

	if (mapQueue.length() > 0) {
		fn = map.toString();
		data = mapQueue.pop(quantity);
		action = 'map';
	} else if (reduceQueue.length() > 0) {
		fn = reduce.toString();
		data = [];
		while (quantity-- > 0) {
			let key = reduceQueue.accumulate();
			let hosts = p2p.findHostsWith(key);
			if (key) {
				data.push({ key, hosts });
			}
		}
		action = 'reduce';
	} else {
		fn = (() => {}).toString();
		data = [];
		action = 'done';
	}

	respond({
		action,
		data,
		fn,
	});
};
