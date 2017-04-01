module.exports = function (data) {
	this.queue = data ? data.slice() : [];

	/**
	 * Pushes an element onto the end of the queue.
	 * @param {*} item An element to be appended.
	 * @return {Number} The new length of the queue.
	 */
	this.push = value => {
		if (typeof value !== 'undefined') {
			this.queue.push(value);
		}
	};

	/**
	 * Calculates the length of the queue.
	 * @return {Number} The length of the internal queue store.
	 */
	this.length = () => this.queue.length;

	/**
	 * Pops the first item off the queue and removes all other items with the same key.
	 * @return {String} A single key
	 */
	this.accumulate = (priority) => {
		let key;

		if (this.length() > 0) {

			key = priority || this.queue[0].key;

			this.queue.forEach((item, i) => {
				if (item.key === key) {
					this.pull(i);
				}
			});

			this.pull(true);
		}

		return key;
	};

	/**
	 * Removes a specific item from the queue
	 * @param  {Number} i Index of the item to remove
	 */
	this.pull = i => {
		if (typeof i === 'undefined') {
			return undefined;
		}

		if (i === true) {
			this.queue = this.queue.filter(each => !each._expired);
			return;
		}

		if (typeof this.queue[i] !== 'undefined') {
			this.queue[i]._expired = true;
		}
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
	this.concat = arr => {
		if (arr && arr.length > 0) {
			this.queue = this.queue.concat(arr);
		}
	};
};
