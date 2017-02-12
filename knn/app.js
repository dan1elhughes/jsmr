const fs = require('fs');

const known = fs.readFileSync('knn/known.csv', 'utf8')
	.split(/\n/) // Split on newlines
	.filter(line => line !== '') // Remove empty lines
	.map(point => point.split(','))
	.map(point => ({class: point[0], x : parseInt(point[1], 10), y: parseInt(point[2], 10)}));

module.exports = {
	debug: {
		print: true,
		// slow: 500
	},

	load: () => fs.createReadStream('knn/unknown.csv', {
		encoding: 'UTF-8'
	}),

	transform: content => content
		.split(/\n/) // Split on newlines
		.filter(line => line !== '') // Remove empty lines
		.map(point => point.split(','))
		.map(point => ({x : parseInt(point[0], 10), y: parseInt(point[1], 10)}))
		.map(unknown => ({ unknown, known })),

	map: data => {
		let { known, unknown } = data;
		let key = `${unknown.x}|${unknown.y}`;

		let results = known.map(point => {
			var x = unknown.x - point.x;
			var y = unknown.y - point.y;

			let distance = Math.sqrt(x*x + y*y);

			return { distance, class: point.class };
		}).sort((a, b) => a.distance - b.distance);

		return { key, value: results };
	},

	reduce: collection => collection.map(point => {
		const K = 3;

		let classes = {};

		for (let i = 0; i < K; i++) {
			let c = point.value[i].class;
			if (classes[c]) {
				classes[c] += 1;
			} else {
				classes[c] = 1;
			}
		}

		let min = {
			class: 'none',
			value: Number.NEGATIVE_INFINITY
		};

		for (let x in classes) {
			if( classes[x] > min.value) {
				min = {
					class: x,
					value: classes[x]
				};
			}
		}

		return min['class'];
	}),

	aggregate: collection => collection
		.map(point => point.value[0] + ',' + point.key.split('|').join(',')),

	write: result => new Promise(resolve => {
		fs.writeFile('./output/knn.csv', result.join("\n"), 'utf8', resolve);
	})
};
