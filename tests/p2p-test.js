const { assert } = require('chai');
const P2P = require('../p2p');

describe('P2P', () => {

	describe(':: constuctor()', () => {
		it('starts empty', () => {
			let p = new P2P();
			assert.deepEqual(p.hosts, {});
		});
	});

	describe('.register()', () => {
		it('does nothing with no parameters', () => {
			let p = new P2P();
			p.register()();
			assert.deepEqual(p.hosts, {});
		});

		it('does nothing with an empty ID', () => {
			let p = new P2P();
			p.register()({
				address: 'address',
				port: 'port'
			});
			assert.deepEqual(p.hosts, {});
		});

		it('does nothing with an empty host', () => {
			let p = new P2P();
			p.register('id')();
			assert.deepEqual(p.hosts, {});
		});

		it('stores given host data against given ID', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			assert.deepEqual(p.hosts, {
				id: {
					address: 'address',
					port: 'port',
					keys: []
				}
			});
		});
	});

	describe('.unregister()', () => {
		it('does nothing with no parameters', () => {
			let p = new P2P();
			p.unregister();
			assert.deepEqual(p.hosts, {});
		});

		it('does nothing with incorrect IDs', () => {
			let p = new P2P();
			p.unregister('id');
			assert.deepEqual(p.hosts, {});
		});

		it('removes host with given ID', () => {
			let p = new P2P();

			p.register('id')({
				address: 'address',
				port: 'port'
			});
			assert.deepEqual(p.hosts, {
				id: {
					address: 'address',
					port: 'port',
					keys: []
				}
			});

			p.unregister('id');
			assert.deepEqual(p.hosts, {});
		});
	});

	describe('.hasKey()', () => {
		it('does nothing with no parameters', () => {
			let p = new P2P();
			p.hasKey()();
			assert.deepEqual(p.hosts, {});
		});

		it('does nothing with an empty ID', () => {
			let p = new P2P();
			p.hasKey()('key');
			assert.deepEqual(p.hosts, {});
		});

		it('does nothing with an empty key', () => {
			let p = new P2P();
			p.hasKey('id')();
			assert.deepEqual(p.hosts, {});
		});

		it('registers a key as residing on the host with the given ID', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			p.hasKey('id')('key');
			assert.deepEqual(p.hosts, {
				id: {
					address: 'address',
					port: 'port',
					keys: ['key']
				}
			});
		});
	});

	describe('.findHostsWith()', () => {
		it('does nothing with no parameters', () => {
			let p = new P2P();
			let hosts = p.findHostsWith();
			assert.deepEqual(hosts, []);
		});

		it('does nothing with an empty key', () => {
			let p = new P2P();
			let hosts = p.findHostsWith(undefined, 'source');
			assert.deepEqual(hosts, []);
		});

		it('returns a list of hosts that have the key', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			p.hasKey('id')('key');
			assert.deepEqual(p.hosts, {
				id: {
					address: 'address',
					port: 'port',
					keys: ['key']
				}
			});

			let hosts = p.findHostsWith('key', 'source');
			assert.deepEqual(hosts, [{
				address: 'address',
				port: 'port'
			}]);
		});

		it('returns nothing when key resides at source', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			p.hasKey('id')('key');
			assert.deepEqual(p.hosts, {
				id: {
					address: 'address',
					port: 'port',
					keys: ['key']
				}
			});

			let hosts = p.findHostsWith('key', 'id');
			assert.deepEqual(hosts, []);
		});
	});
});
