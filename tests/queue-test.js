const { assert } = require('chai');
const Queue = require('../Queue');

describe('Queue', () => {

	describe(':: constructor()', () => {

		it('starts empty', () => {
			let q = new Queue();
			assert.deepEqual(q.queue, []);
		});

		it('allows construction with data', () => {
			let q = new Queue([1, 2, 3]);
			assert.deepEqual(q.queue, [1, 2, 3]);
		});

		it('does not keep a reference to the data array', () => {
			let arr = [1, 2, 3];
			let q = new Queue(arr);
			arr.shift();

			assert.deepEqual(arr, [2, 3]);
			assert.deepEqual(q.queue, [1, 2, 3]);
		});
	});

	describe('.push()', () => {
		it('does not push blank elements', () => {
			let q = new Queue([1, 2, 3]);
			q.push();

			assert.deepEqual(q.queue, [1, 2, 3]);
		});

		it('pushes data to the end of the queue', () => {
			let q = new Queue([1, 2, 3]);
			q.push(4);

			assert.deepEqual(q.queue, [1, 2, 3, 4]);
		});
	});

	describe('.length()', () => {
		it('returns the length of the internal array', () => {
			let q = new Queue();
			let length = q.length();
			assert.equal(length, 0);

			q.push(0);
			length = q.length();
			assert.equal(length, 1);
		});
	});

	describe('.accumulate()', () => {
		it('returns an undefined key with an empty queue', () => {
			let q = new Queue();
			let result = q.accumulate();
			assert.isUndefined(result);
		});

		it('removes all items when returning a key', () => {
			let q = new Queue();
			q.push({
				key: 'A'
			});
			q.push({
				key: 'A'
			});
			q.push({
				key: 'B'
			});

			let key = q.accumulate();

			assert.equal(key, 'A');
			assert.deepEqual(q.queue, [{
				key: 'B'
			}]);
		});
	});

	describe('.pull()', () => {
		it('does nothing with no index given', () => {
			let q = new Queue([1, 2, 3]);
			let result = q.pull();

			assert.isUndefined(result);
			assert.deepEqual(q.queue, [1, 2, 3]);
		});

		it('does nothing on an empty array', () => {
			let q = new Queue();
			let result = q.pull(0);

			assert.isUndefined(result);
			assert.deepEqual(q.queue, []);
		});

		it('removes and return an element at the given index', () => {
			let q = new Queue([1, 2, 3]);
			let result = q.pull(1);

			assert.equal(result, 2);
			assert.deepEqual(q.queue, [1, 3]);
		});
	});

	describe('.pop()', () => {
		it('returns an empty on an empty array', () => {
			let q = new Queue();
			let result = q.pop();

			assert.deepEqual(result, []);
			assert.deepEqual(q.queue, []);
		});

		it('returns and removes the first element of the array with no parameters', () => {
			let q = new Queue([1, 2, 3]);
			let result = q.pop();

			assert.deepEqual(result, [1]);
			assert.deepEqual(q.queue, [2, 3]);
		});

		it('returns the first given N elements of the array', () => {
			let q = new Queue([1, 2, 3]);
			let result = q.pop(2);

			assert.deepEqual(result, [1, 2]);
			assert.deepEqual(q.queue, [3]);
		});
	});

	describe('.concat()', () => {
		it('does nothing with no parameters', () => {
			let q = new Queue([1, 2, 3]);
			q.concat();

			assert.deepEqual(q.queue, [1, 2, 3]);
		});

		it('does nothing on an empty array', () => {
			let q = new Queue([1, 2, 3]);
			q.concat([]);

			assert.deepEqual(q.queue, [1, 2, 3]);
		});

		it('appends a given array to the internal array', () => {
			let q = new Queue([1, 2, 3]);
			q.concat([4, 5]);

			assert.deepEqual(q.queue, [1, 2, 3, 4, 5]);
		});
	});
});
