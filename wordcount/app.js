const fs = require('fs');

module.exports = {
	debug: {
		print: true,
		// slow: 500
	},

	load: () => fs.createReadStream('wordcount/huge.txt', {
		encoding: 'UTF-8'
	}),

	transform: content => content
		.split(/\n| /) // Split on newlines and spaces
		.map(word => word
			.trim() // Remove extra spacing around words
			.replace(/\W/g, '') // Remove any non-alphabet characters
			.toLowerCase() // Convert words to lowercase
		)
		.filter(word => word !== ''), // Remove any empty words (i.e. just symbols)

	map: word => ({ key: word, value: 1 }),

	reduce: collection => collection.reduce((sum, word) => sum + word.value, 0),

	combine: collection => collection.reduce((sum, word) => sum + word.value, 0),

	filter: word => word.value > 1,

	aggregate: collection => collection
		.sort((a, b) => b.value - a.value),

	write: result => new Promise(resolve => {
		fs.writeFile('./output/output.json', JSON.stringify(result, null, '\t'), 'utf8', resolve);
	})
};
