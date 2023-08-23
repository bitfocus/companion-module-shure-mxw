function CreateModelChoices() {
	let choices = Object.values(Models)
	// Sort alphabetical
	choices.sort(function (a, b) {
		let x = a.label.toLowerCase()
		let y = b.label.toLowerCase()
		if (x < y) {
			return -1
		}
		if (x > y) {
			return 1
		}
		return 0
	})

	return choices
}

export const Models = {
	mxwapt2: { id: 'mxwapt2', label: 'MXWAPT2 Dual Access Point', channels: 2 },
	mxwapt4: { id: 'mxwapt4', label: 'MXWAPT4 Quad Access Point', channels: 4 },
	mxwapt8: { id: 'mxwapt8', label: 'MXWAPT8 Octo Access Point', channels: 8 },
	mxwani4: { id: 'mxwani4', label: 'MXWANI4 Quad Receiver', channels: 4 },
	mxwani8: { id: 'mxwani8', label: 'MXWANI8 Octo Receiver', channels: 8 },
}

export const Choices = {
	Models: CreateModelChoices(),
	OnOffToggle: [
		{ id: 'ON', label: 'Mute' },
		{ id: 'OFF', label: 'Unmute' },
		{ id: 'TOGGLE', label: 'Toggle Mute/Unmute' },
	],
}

export const Fields = {
	BatteryLevel: {
		type: 'number',
		label: 'Battery Alert Level',
		id: 'barlevel',
		min: 1,
		max: 5,
		default: 2,
		required: true,
		range: true,
	},
	GainIncrement: {
		type: 'number',
		label: 'Gain Value (dB)',
		id: 'gain',
		min: 1,
		max: 40,
		default: 3,
		required: true,
		range: true,
	},
	GainSet: {
		type: 'number',
		label: 'Gain Value (dB)',
		id: 'gain',
		min: -25,
		max: 15,
		default: 0,
		required: true,
		range: true,
	},
	Mute: {
		type: 'dropdown',
		label: 'Mute/Unmute/Toggle',
		id: 'choice',
		default: 'ON',
		choices: Choices.OnOffToggle,
	},
	Name: {
		type: 'textinput',
		label: 'Name (31 characters max)',
		id: 'name',
		default: '',
		regex: '/^.{1,31}$/',
	},
}
