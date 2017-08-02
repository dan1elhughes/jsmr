# JSMR

_JavaScript MapReduce_

JSMR is a JavaScript system for processing big data on distributed systems. It automatically parallelizes MapReduce problems, with load balancing across all nodes in the system, and uses purely in-memory storage for low latency. It also contains a distributed key-value store for spreading the storage load across all nodes in the system. It offers a near linear performance improvement as hardware is added. It is a rapidly installable system for one-off distributed processing on standard desktop hardware. It requires little to no configuration, is applicable to a wide range of problems within the MapReduce paradigm, and scales effectively.

* **Declarative:** JSMR handles the details of how data is communicated and balanced between nodes. You only need to write the application code and set the controller IP address.
* **Scalable:** Each worker contains its own load balancer, to request the correct amount of data for its own processing capability. More powerful machines will scale up faster to process data faster as the application runs.
* **Simple:** In comparison to other solutions, JSMR only needs Node installed. The entire stack from communication to data storage is written in JavaScript.

## Examples

This example runs a simple wordcount. This code is bundled with the application; to run it, set the `APP` environment variable to `wordcount`.

```js
module.exports = {

	// Read the input as a stream.
	load: () => require('rs').createReadStream('file.txt', {
		encoding: 'UTF-8'
	}),

	// Transform each stream chunk into a collection of words on arrival.
	transform: content => content
		.split(/\n| /)
		.map(word => word.trim().replace(/\W/g, '').toLowerCase())
		.filter(word => word !== ''),

	// Count one for each word encountered.
	map: word => ({ key: word, value: 1 }),

	// Count up words with the same key as soon as possible while mapping continues.
	combine: collection => collection.reduce((sum, word) => sum + word.value, 0),

	// Count up all words with the same key once all mapping has finished.
	reduce: collection => collection.reduce((sum, word) => sum + word.value, 0),

	// Sort words by occurence.
	aggregate: collection => collection.sort((a, b) => b.value - a.value),

	// Write the output to a file.
	write: result => new Promise(resolve => {
		fs.writeFile('./output/wordcount.json', JSON.stringify(result, null, '\t'), 'utf8', resolve);
	})
};
```

## Installation

- Clone this repository onto each machine
- Run `npm install`
- Create a `.env` file with the following properties:
	- For a worker: `CONTROLLER_IP=1.2.3.4` where `1.2.3.4` is the IP address of the controller to connect to.
	- For a controller: `APP=wordcount` where `wordcount` is the name of the application to run.

## Next steps

- Browser-based client access to add resources by visiting a URL
- Simultaneous job support
- Data replication for fault tolerance
- Docker support
