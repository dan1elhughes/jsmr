const fs = require('fs');

module.exports = {
	debug: {
		print: true
	},

	ideal_time: 500,

	load: () => fs.createReadStream('mutualfriends/input.csv', {
		encoding: 'UTF-8'
	}),

	transform: content => content
		.split(/\n/) // Split on newlines
		.filter(line => line !== '') // Remove empty lines
		.map(line => line.split(',')) // Split into person and friends
		.map(data => ({ person: data[0], friends: data[1].split("|") })),

	map: ({ person, friends }) => friends.map(friend => ({
		key: [person, friend].sort().join('|'),
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
		let intersection = intersect(values[0], values[1]).join("|");
		return intersection;
	},

	filter: item => {
		let mutuals = item.value.split("|");
		return mutuals[0] !==  "" && mutuals.length > 0;
	},

	aggregate: collection => collection.sort((a, b) => b.value.length - a.value.length),

	write: result => new Promise(resolve => {
		fs.writeFile('./output/mutualfriends.csv', result.map(_ => `${_.key},${_.value}`).join("\n"), 'utf8', resolve);
	})
};
