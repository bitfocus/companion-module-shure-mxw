import { Fields } from './setup.js'

/**
 * INTERNAL: Set the available actions.
 */
export function updateActions() {
	this.setupChannelChoices()

	let actions = {}

	actions['set_channel_name'] = {
		name: 'Set channel name',
		options: [this.CHANNELS_FIELD, Fields.Name],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} CHAN_NAME {${options.name.substr(0, 8)}}`)
		},
	}

	actions['channel_setaudiogain'] = {
		name: 'Set audio gain of channel',
		options: [this.CHANNELS_A_FIELD, Fields.GainSet],
		callback: async ({ options }) => {
			let value = options.gain + 25

			this.sendCommand(`SET ${options.channel} AUDIO_GAIN ${value}`)
		},
	}

	actions['channel_increasegain'] = {
		name: 'Increase audio gain of channel',
		options: [this.CHANNELS_A_FIELD, Fields.GainIncrement],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} AUDIO_GAIN INC ${options.gain}`)
		},
	}

	actions['channel_decreasegain'] = {
		name: 'Decrease audio gain of channel',
		options: [this.CHANNELS_A_FIELD, Fields.GainIncrement],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} AUDIO_GAIN DEC ${options.gain}`)
		},
	}

	actions['flash_lights'] = {
		name: 'Flash lights on receiver',
		tooltip: 'It will automatically turn off after 30 seconds',
		options: [],
		callback: async ({ options }) => {
			this.sendCommand(`SET FLASH ON`)
		},
	}

	actions['flash_channel'] = {
		name: 'Flash lights on receiver channel',
		tooltip: 'It will automatically turn off after 60 seconds',
		options: [this.CHANNELS_FIELD],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} FLASH ON`)
		},
	}

	this.setActionDefinitions(actions)
}
