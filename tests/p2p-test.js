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
					keys: [],
					backups: []
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
					keys: [],
					backups: []
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

		it('does nothing with an invalid id', () => {
			let p = new P2P();
			p.hasKey('id')('key');
			assert.deepEqual(p.hosts, {});
		});

		it('registers a key as residing on the host with the given ID', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			p.hasKey('id')('key');

			assert.equal(p.hosts.id.address, 'address');
			assert.equal(p.hosts.id.port, 'port');
		});
	});

	describe('.getLightestPeer()', () => {
		it('does nothing when no nodes are connected', () => {
			let p = new P2P();
			let lightest = p.getLightestPeer();
			assert.isUndefined(lightest);
		});

		it('stores the key at a secondary location', () => {
			let p = new P2P();

			p.register('id1')({ address: 'address1', port: 'port1' });
			p.register('id2')({ address: 'address2', port: 'port2' });

			p.hasKey('id1')('key1');

			assert.include(p.hosts.id2.backups, 'key1');
		});

		it('returns the ID of the peer with lightest load', () => {
			let p = new P2P();

			p.register('id1')({ address: 'address1', port: 'port1' });
			p.register('id2')({ address: 'address2', port: 'port2' });
			p.register('id3')({ address: 'address3', port: 'port3' });

			p.hasKey('id1')('key1');
			p.hasKey('id2')('key2');
			p.hasKey('id2')('key3');

			let lightest = p.getLightestPeer();
			assert.equal(lightest, 'id3');

			p.hasKey('id1')('key4');
			p.hasKey('id1')('key5');

			lightest = p.getLightestPeer();
			assert.equal(lightest, 'id2');
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

			let hosts = p.findHostsWith('key', 'source');

			assert.deepEqual(hosts, [{
				address: 'address',
				port: 'port',
				type: 'primary'
			}]);
		});

		it('returns nothing when key resides at source', () => {
			let p = new P2P();
			p.register('id')({
				address: 'address',
				port: 'port'
			});
			p.hasKey('id')('key');

			let hosts = p.findHostsWith('key', 'id');
			assert.deepEqual(hosts, []);
		});
	});
});
