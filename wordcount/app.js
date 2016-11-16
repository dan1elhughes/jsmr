module.exports = {
	load: () => 'It was November, although it was not yet late.',
	// load: () => 'It was November. Although it was not yet late, the sky was dark when I turned into Laundress Passage. Father had finished for the day, switched off the shop lights and closed the shutters; but so I would not come home to darkness he had left on the light over the stairs to the flat. Through the glass in the door it cast a foolscap rectangle of paleness onto the wet pavement, and it was while I was standing in that rectangle, about to turn my key in the door, that I first saw the letter. Another white rectangle, it was on the fifth step from the bottom, where I couldn\'t miss it. I closed the door and put the shop key in its usual place behind Bailey\'s Advanced Principles of Geometry. Poor Bailey. No one has wanted his fat gray book for thirty years. Sometimes I wonder what he makes of his role as guardian of the bookshop keys. I don\'t suppose it\'s the destiny he had in mind for the masterwork that he spent two decades writing. A letter. For me. That was something of an event. The crisp-cornered envelope, puffed up with its thickly folded contents, was addressed in a hand that must have given the postman a certain amount of trouble. Although the style of the writing was old-fashioned, with its heavily embellished capitals and curly flourishes, my first impression was that it had been written by a child. The letters seemed untrained. Their uneven strokes either faded into nothing or were heavily etched into the paper. There was no sense of flow in the letters that spelled out my name. Each had been undertaken separately as a new and daunting enterprise. But I knew no children. That is when I thought, It is the hand of an invalid.',

	partition: content => content
		.split(' ')
		.map(word => word
			.replace(/\W/g, '')
			.toLowerCase()
		),

	map: word => ({ key: word, value: 1 }),

	shuffle: (a, b) => a.key === b.key,

	reduce: collection => collection.reduce((sum, word) => sum + word.value, 0),

	combine: collection => collection
		.sort((a, b) => b.value - a.value)
		.map(word => word.key)
};
