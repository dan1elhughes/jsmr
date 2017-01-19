const { assert } = require('chai');
const Queue = require('../Queue');

describe('Queue', () => {

	describe(':: constructor()', () => {
		it('starts empty', () => {});
		it('allows construction with data', () => {});
		it('does not keep a reference to the data array', () => {});
	});

	describe('.push()', () => {
		it('does not push blank elements', () => {});
		it('pushes data to the end of the queue', () => {});
	});

	describe('.length()', () => {
		it('returns the length of the internal array', () => {});
	});

	describe('.accumulate()', () => {
		it('returns an empty array with an empty queue', () => {});
		it('removes all items when returning a key', () => {});
	});

	describe('.pull()', () => {
		it('does nothing on an empty array', () => {});
		it('does nothing with no index given', () => {});
		it('removes and return an element at the given index', () => {});
	});

	describe('.pop()', () => {
		it('does nothing on an empty array', () => {});
		it('returns the first element of the array with no parameters', () => {});
		it('returns the first given N elements of the array', () => {});
	});

	describe('.concat()', () => {
		it('does nothing on an empty array', () => {});
		it('appends a given array to the internal array', () => {});
	});
});
