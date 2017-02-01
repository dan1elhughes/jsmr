const os = require('os');

module.exports = () => {
	var ifs = os.networkInterfaces();
	return Object.keys(ifs)

		// Remove virtualbox interfaces
		.filter(name => name.indexOf('VirtualBox') === -1)

		// Convert names to interfaces
		.map(name => ifs[name])

		// Remove non-ipv4 interfaces
		.map(interface => interface.filter(x => x.family === 'IPv4')[0])

		// Remove empty interfaces
		.filter(interface => typeof interface !== 'undefined')

		// Remove internal i.e. loopback interfaces
		.filter(interface => interface.internal === false)

		// Convert to usable IP string
		.map(interface => interface.address)

		// Extract remaining value from array
		.shift();
};
