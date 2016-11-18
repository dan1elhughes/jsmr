module.exports = function (data) {
	this.queue = data ? data.slice() : [];

	this.push = this.queue.push.bind(this.queue);

	this.length = () => this.queue.length;

	this.pop = count => {
		count = count || 1;
		let results = [];

		while (count --> 0) {
			let value = this.queue.shift();

			if (value) {
				results.push(value);
			} else if (this.queue.length === 0) {
				results.push(null);
				count = 0;
			}
		}

		return results;
	};
};
