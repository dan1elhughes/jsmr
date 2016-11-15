module.exports = (socket, data, components) => Promise.all([
	new Promise(resolve => socket.emit('data', data, resolve)),

	new Promise(resolve => socket.emit('map', components.map.toString(), resolve)),
	new Promise(resolve => socket.emit('reduce', components.reduce.toString(), resolve))
]);
