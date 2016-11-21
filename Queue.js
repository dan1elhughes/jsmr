module.exports = function (data) {
	this.queue = data ? data.slice() : [];

	this.push = this.queue.push.bind(this.queue);

	this.length = () => this.queue.length;

	/**
	 * Pops the first item off the queue and all other items with the same key.
	 * @return {Array} A collection of items with matching keys
	 */
	this.accumulate = () => {
		let first = this.queue.pop();
		let matches = [];
		if (first) {
			matches.push(first);
			let key = first.key;

			this.queue.forEach((element, i) => {
				if (element.key === key) {
					matches.push(this.pull(i));
				}
			});
		}

		return matches;
	};

	/**
	 * Removes a specific item from the queue
	 * @param  {Number} i Index of the item to remove
	 * @return {Element} The element
	 */
	this.pull = i => this.queue.splice(i, 1)[0];

	this.pop = count => {
		count = count || 1;
		let results = [];

		while (count --> 0) {
			let value = this.queue.shift();

			if (value) {
				results.push(value);
			} else {
				count = 0;
			}
		}

		return results;
	};
};
