const fs = require('fs');

module.exports = {
	debug: {
		print: true,
		// slow: 200
	},

	// huge.txt: 114,242 words
	// large.txt: 18,724 words
	// medium.txt: 1,494 words
	// short.txt: 49 words
	load: () => fs.createReadStream('wordcount/large.txt', {
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

	combine: collection => collection.reduce((sum, word) => sum + word.value, 0),

	reduce: collection => collection.reduce((sum, word) => sum + word.value, 0),

	filter: word => word.value > 1,

	aggregate: collection => collection
		.sort((a, b) => b.value - a.value),

	write: result => new Promise(resolve => {
		fs.writeFile('./output/wordcount.json', JSON.stringify(result, null, '\t'), 'utf8', resolve);
	})
};
