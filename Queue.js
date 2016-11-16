module.exports = function (data) {
	this.queue = data.slice() || [];

	this.push = this.queue.push;

	this.pop = count => {
		count = count || 1;
		let results = [];

		while (count --> 0) {
			results.push(this.queue.shift());
		}

		return results;
	};
};
