const log = require('single-line-log')(process.stdout);
const CLEAR = 1, REWRITEABLE = 2, FORCE = 3;

module.exports = {
	CLEAR,
	REWRITEABLE,
	FORCE,

	print: enabled => (tag, val, flag) => {
		if (enabled || flag === FORCE) {
			if (tag === CLEAR) {
				console.log('');
				return;
			} else {
				let msg = `${tag} :: ${val}`;
				if (flag === REWRITEABLE) {
					// output to stdout without an end marker. Next
					// call of log will overwrite this line.
					log(msg);
				} else {
					// output to stdout with an end marker. Overwrites
					// previous log, and moves the cursor to the next
					// line.
					log(msg.concat(`\n`));
					console.log('');
				}
			}
		}
	},
};
