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

	/**
	 * Finds hosts with certain keys.
	 * @param  {String} key    The key of the key/value pair.
	 * @param  {String} source The socket ID of the request originator.
	 * @return {Array}        Remote connection details for every host with something for the key.
	 */
	this.findHostsWith = (key, source) => {
		let r = [];
		Object.keys(this.hosts).forEach(id => {
			if (this.hosts[id].keys.includes(key) && id !== source) {
				r.push({
					address: this.hosts[id].address,
					port: this.hosts[id].port,
				});
			}
		});
		return r;
	};
};
