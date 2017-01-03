const fs = require('fs');

module.exports = {
	load: () => fs.createReadStream('wordcount/data.txt', {
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

	filter: result => result > 1,

	combine: collection => collection
		.sort((a, b) => b.value - a.value)
		.map(word => word.key)
};
