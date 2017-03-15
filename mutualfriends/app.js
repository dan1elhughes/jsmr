const fs = require('fs');

module.exports = {
	debug: {
		print: true
	},

	load: () => fs.createReadStream('mutualfriends/input.csv', {
		encoding: 'UTF-8'
	}),

	transform: content => content
		.split(/\n/) // Split on newlines
		.filter(line => line !== '') // Remove empty lines
		.map(line => line.split(',')) // Split into person and friends
		.map(data => ({ person: data[0], friends: data[1].split("|") })),

	map: ({ person, friends }) => friends.map(friend => ({
		key: [person, friend].sort().join(','),
		value: friends,
	})),

	reduce: collection => {
		let intersect = (a, b) => {
			/*
			 * Credit to nbarbosa on stackoverflow for this
			 * array intersection function
			 * http://stackoverflow.com/a/37041756/1964179
			 */
			let setA = new Set(a);
			let setB = new Set(b);
			let intersection = new Set([...setA].filter(x => setB.has(x)));
			return Array.from(intersection);
		};

		let values = collection.map(_ => _.value);
		let intersection = intersect(values[0], values[1]).join(",");
		return intersection;
	},

	write: result => new Promise(resolve => {
		fs.writeFile('./output/mutualfriends.csv', JSON.stringify(result, null, '\t'), 'utf8', resolve);
	})
};
