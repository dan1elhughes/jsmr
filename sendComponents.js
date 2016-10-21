module.exports = (socket, components) => Promise.all([
	new Promise(resolve => socket.emit('data', components.data, resolve)),
	new Promise(resolve => socket.emit('process', components.process.toString(), resolve)),
]);
