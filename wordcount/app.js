const fs = require('fs');

module.exports = {
	load: () => fs.createReadStream('wordcount/data.txt', {
		encoding: 'UTF-8'
	}),

	partition: content => content
		.split(' ')
		.map(word => word
			.replace(/\W/g, '')
			.toLowerCase()
		),

	map: word => ({ key: word, value: 1 }),

	reduce: collection => collection.reduce((sum, word) => sum + word.value, 0),

	combine: collection => collection
		.sort((a, b) => b.value - a.value)
		.map(word => word.key)
};
