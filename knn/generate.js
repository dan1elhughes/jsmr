const fs = require('fs');
let known = 200;
let knownpoints = [];
let unknown = 3000;
let unknownpoints = [];

let xmax = 1000;
let ymax = 1000;

let rand = (min, max) => Math.floor(Math.random() * max) + min;

while (known-- > 0) {

	let point = {
		x: rand(0, xmax),
		y: rand(0, ymax),
		class: 'blue',
	};

	if (point.x > (xmax/2)) {
		point['class'] = "red";
	}

	knownpoints.push(point);
}

while (unknown-- > 0) {

	let point = {
		x: rand(0, xmax),
		y: rand(0, ymax),
	};

	unknownpoints.push(point);
}

fs.writeFile('known.csv', knownpoints.map(pt => `${pt['class']},${pt.x},${pt.y}`).join("\n"), err => {
	if (err) {
		return console.log(err);
	}
	console.log('Written known');
});

fs.writeFile('unknown.csv', unknownpoints.map(pt => `${pt.x},${pt.y}`).join("\n"), err => {
	if (err) {
		return console.log(err);
	}
	console.log('Written unknown');
});
