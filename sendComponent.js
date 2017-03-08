const console = require('util');

let timings = {};

module.exports = (components) => (quantity, respond) => {

	let { map, combine, reduce, ideal_time, mapQueue, reduceQueue, socket, p2p, debug } = components;

	if (typeof ideal_time === 'undefined') {
		ideal_time = 500;
	}

	console.log(`SEND: ${socket} (M${mapQueue.length()} R${reduceQueue.length()})`);

	let fn, data, action;

	if (mapQueue.length() > 0) {
		fn = map.toString();
		if (combine) {
			fn += '/|/' + combine.toString();
		}
		data = mapQueue.pop(quantity);
		action = 'map';

		timings[socket] = {
			time: new Date(),
			count: 1
		};

	} else if (reduceQueue.length() > 0) {
		fn = reduce.toString();
		data = [];

		let last = timings[socket].time;
		let now = new Date();

		if (now - last > ideal_time && timings[socket].count > 1) {
			timings[socket].count--;
		} else {
			timings[socket].count++;
		}

		timings[socket].time = new Date();

		let i = timings[socket].count;

		while (i-- > 0) {
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
