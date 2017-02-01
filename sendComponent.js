const console = require('util');

module.exports = (components) => (quantity, respond) => {

	let { map, combine, reduce, ideal_time, mapQueue, reduceQueue, socket, p2p, debug } = components;

	console.log(`SEND: ${socket} (${quantity} of M${mapQueue.length()} R${reduceQueue.length()})`);

	let fn, data, action;

	if (mapQueue.length() > 0) {
		fn = map.toString();
		if (combine) {
			fn += '/|/' + combine.toString();
		}
		data = mapQueue.pop(quantity);
		action = 'map';
	} else if (reduceQueue.length() > 0) {
		fn = reduce.toString();
		data = [];
		while (quantity-- > 0) {
			let key = reduceQueue.accumulate();
			if (key) {
				data.push({
					key,
					hosts: p2p.findHostsWith(key)
				});
			}
		}
		action = 'reduce';
	} else {
		fn = (() => {}).toString();
		data = [];
		action = 'done';
	}

	let backups = p2p.claimBackups(socket);

	let output = () => respond({
		action,
		backups,
		data,
		debug,
		fn,
		ideal_time,
	});

	if (debug.slow) {
		setTimeout(output, debug.slow);
	} else {
		output();
	}
};
