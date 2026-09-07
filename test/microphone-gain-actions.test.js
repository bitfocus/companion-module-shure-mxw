import assert from 'node:assert/strict'
import test from 'node:test'

import { updateActions } from '../src/actions.js'

function createActions() {
	let actions
	const instance = {
		CHANNELS_A_FIELD: { id: 'channel' },
		setupChannelChoices() {},
		setActionDefinitions(definitions) {
			actions = definitions
		},
	}

	updateActions.call(instance)
	return { actions, instance }
}

test('microphone gain actions use the selected channel internal input', async () => {
	const { actions, instance } = createActions()
	const commands = []
	instance.sendCommand = (command) => {
		commands.push(command)
	}

	await actions.microphone_setaudiogain.callback({ options: { channel: 3, gain: 0 } })
	await actions.microphone_increasegain.callback({ options: { channel: 3, gain: 2 } })
	await actions.microphone_decreasegain.callback({ options: { channel: 3, gain: 2 } })

	assert.deepEqual(commands, ['SET 3 INT_AUDIO_GAIN 25', 'SET 3 INT_AUDIO_GAIN INC 2', 'SET 3 INT_AUDIO_GAIN DEC 2'])
})
