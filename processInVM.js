const vm = require('vm');
const console = require('util');

/**
 * Executes code in a secure JSVM sandbox.
 * @param  {String} fn   Source string of a function to be executed as an IIFE on the data
 * @param  {*}      data Any data to be made available to the function
 * @return {*}      The return value of the function execution
 */
module.exports = (fn, data) => {
	let context = vm.createContext({
		console,
		data
	});

	// console.log(`PROC: ${JSON.stringify(data)}`);
	let result = vm.runInContext(`((${fn})(data))`, context);

	return result;
};
