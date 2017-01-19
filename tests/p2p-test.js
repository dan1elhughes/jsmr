const { assert } = require('chai');
const P2P = require('../p2p');

describe('P2P', () => {

	describe(':: constuctor()', () => {
		it('starts empty', () => {});
	});

	describe('.register()', () => {
		it('does nothing with no parameters', () => {});
		it('does nothing with an empty ID', () => {});
		it('does nothing with an empty host', () => {});
		it('stores given host data against given ID', () => {});
	});

	describe('.unregister()', () => {
		it('does nothing with no parameters', () => {});
		it('does nothing with incorrect IDs', () => {});
		it('does nothing when given ID is not already registered', () => {});
		it('removes host with given ID', () => {});
	});

	describe('.hasKey()', () => {
		it('does nothing with no parameters', () => {});
		it('does nothing with an empty ID', () => {});
		it('does nothing with an empty key', () => {});
		it('registers a key as residing on the host with the given ID', () => {});
	});

	describe('.findHostsWith()', () => {
		it('does nothing with no parameters', () => {});
		it('does nothing with an empty key', () => {});
		it('returns a list of hosts that have the key', () => {});
		it('returns nothing when key resides at source', () => {});
		it('returns hosts when key not stored at the source', () => {});
	});
});
