module.exports = function (data) {
	this.queue = data ? data.slice() : [];

	/**
	 * Pushes an element onto the end of the queue.
	 * @param {*} item An element to be appended.
	 * @return {Number} The new length of the queue.
	 */
	this.push = this.queue.push.bind(this.queue);

	/**
	 * Calculates the length of the queue.
	 * @return {Number} The length of the internal queue store.
	 */
	this.length = () => this.queue.length;

	/**
	 * Pops the first item off the queue and removes all other items with the same key.
	 * @return {String} A single key
	 */
	this.accumulate = () => {
		let key, first = this.pop()[0];
		if (first) {
			key = first.key;

			this.queue.forEach((element, i) => {
				if (element.key === key) {
					this.pull(i);
				}
			});
		}

		return key;
	};

	/**
	 * Removes a specific item from the queue
	 * @param  {Number} i Index of the item to remove
	 * @return {Element} The element
	 */
	this.pull = i => {
		if (typeof i === 'undefined') {
			return undefined;
		}

		return this.queue.splice(i, 1)[0];
	};

	/**
	 * Removes items from the front of the queue.
	 * @param  {Number} count The number of items to remove from the queue. Defaults to 1.
	 * @return {Array} The items popped off the queue.
	 */
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

	/**
	 * Appends an array onto the queue.
	 * @param  {Array} arr An array to be pushed onto the queue
	 */
	this.concat = arr => this.queue = this.queue.concat(arr);
};
