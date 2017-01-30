module.exports = function () {

	/**
	 * Stores the list of keys and hosts that the controller knows about.
	 * @type {Object}
	 */
	this.hosts = {};

	/**
	* Registers a host with the P2P controller.
	* Curried function.
	 * @param  {String} id The socket ID of the host
	 * @param  {Object} host The address and port of the host
	 * @return {void}
	 */
	this.register = id => host => {
		if (id && host && host.address && host.port) {
			this.hosts[id] = {
				address: host.address,
				port: host.port
			};
			this.hosts[id].keys = [];
			this.hosts[id].backups = [];
		}
	};

	/**
	 * Forgets a host
	 * @param  {String} id The socket ID of a host
	 * @return {void}
	 */
	this.unregister = id => {
		delete this.hosts[id];
	};

	this.registerBackup = id => data => {
		if (id && data) {
			let key = data.key;
			let host = {
				id,
				address: this.hosts[id].address,
				port: this.hosts[id].port,
			};

			this.unclaimedBackups.push({ key, host });
		}
	};

	/**
	 * Tells the controller that a certain host has a certain key.
	 * Curried function.
	 * @param  {String}  id The socket ID of a host
	 * @param  {String}  key The key of the key/value pair, derived from the data.
	 * @return {void}
	 */
	this.hasKey = id => key => {
		if (id && key && this.hosts[id]) {
			this.hosts[id].keys.push(key);
		}
	};

	this.claimBackups = id => {
		let claimed = [];

		this.unclaimedBackups = this.unclaimedBackups.filter(backup => {
			if (backup.host.id !== id && this.hosts[id]) {
				claimed.push({
					key: backup.key,
					host: backup.host
				});
				this.hosts[id].backups.push(backup.key);
				return false;
			}

			return true;
		});

		return claimed;
	};

	this.unclaimedBackups = [];

	/**
	 * Returns the ID of the peer storing the least amount of data.
	 * @return {String} The socket ID of the lightest node
	 */
	this.getLightestPeer = () => {
		let lightest = {
			id: undefined,
			keys: Infinity
		};

		Object.keys(this.hosts).forEach(id => {
			let keys = this.hosts[id].keys.length + this.hosts[id].backups.length;

			if (keys < lightest.keys) {
				lightest = { id, keys };
			}
		});

		return lightest.id;
	};

	/**
	 * Finds hosts with certain keys.
	 * @param  {String} key    The key of the key/value pair.
	 * @param  {String} source The socket ID of the request originator.
	 * @return {Array}        Remote connection details for every host with something for the key.
	 */
	this.findHostsWith = (key, source) => {
		let r = [];
		Object.keys(this.hosts).forEach(id => {
			if (id !== source) {
				let type;

				if (this.hosts[id].keys.includes(key) && id !== source) {
					type = 'primary';
				} else if (this.hosts[id].backups.includes(key) && id !== source) {
					type = 'secondary';
				}

				if (type) {
					r.push({
						address: this.hosts[id].address,
						port: this.hosts[id].port,
						type
					});
				}
			}
		});
		return r;
	};
};
