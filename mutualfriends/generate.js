const readline = require('readline');
const fs = require('fs');
let names = [];

let rand = (min, max) => Math.floor(Math.random() * max) + min;
var randItem = arr => arr[rand(0, arr.length)];

let rl = readline.createInterface({
	input : fs.createReadStream('300names.txt'),
	output: process.stdout,
	terminal: false
});

// 100 16
// 120 26
// 130 35
// 140 50
// 150 70

rl.on('line', line => {
	names.push(line);
	if (names.length === 200) {
		names.sort();
		proc(names);
	}
});

function proc(names) {

	let people = names.map(name => {
		let connections = rand(5, 20);

		let friends = [];

		while (connections-- > 0) {
			friends.push(randItem(names));
		}

		return {
			name,
			friends
		};
	});

	fs.writeFile('input.csv', people.map(person => `${person.name},${person.friends.join("|")}`).join("\n"), err => {
		if (err) {
			return console.log(err);
		}
		console.log('Written');
	});
}
