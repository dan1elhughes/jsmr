module.exports = function () {
	this.hosts = {};

	this.register = id => host => {
		this.hosts[id] = {
			address: host.address,
			port: host.port
		};
		this.hosts[id].keys = [];
		console.log(this.hosts);
	};

	this.unregister = id => {
		delete this.hosts[id];
	};

	this.hasKey = id => key => {
		this.hosts[id].keys.push(key);
		console.log(this.hosts);
	};
};
