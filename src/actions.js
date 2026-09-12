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
			this.sendCommand(`SET ${options.channel} CHAN_NAME {${options.name.substr(0, 31)}}`)
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

	actions['microphone_setaudiogain'] = {
		name: 'Set audio gain of microphone',
		options: [this.CHANNELS_A_FIELD, Fields.GainSet],
		callback: async ({ options }) => {
			let value = options.gain + 25

			this.sendCommand(`SET ${options.microphone} AUDIO_GAIN ${value}`)
		},
	}

	actions['microphone_increasegain'] = {
		name: 'Increase audio gain of microphone',
		options: [this.CHANNELS_A_FIELD, Fields.GainIncrement],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.microphone} AUDIO_GAIN INC ${options.gain}`)
		},
	}

	actions['microphone_decreasegain'] = {
		name: 'Decrease audio gain of microphone',
		options: [this.CHANNELS_A_FIELD, Fields.GainIncrement],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.microphone} AUDIO_GAIN DEC ${options.gain}`)
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

	actions['unlink_channel'] = {
		name: 'Unlink any mic in any charger from any APT',
		tooltip:
			'If the linked transmitter is off, or on a non-networked charger, it does not receive the unlink, but will not be able to reconnect to the APT channel',
		options: [this.CHANNELS_A_FIELD],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} UNLINK`)
		},
	}

	actions['set_led_state'] = {
		name: 'Set the LED state of a channel',
		options: [this.CHANNELS_A_FIELD, Fields.RedLEDState, Fields.GreenLEDState],
		callback: async ({ options }) => {
			this.sendCommand(`SET ${options.channel} LED_STATUS ${options.redled} ${options.greenled}`)
		},
	}

	this.setActionDefinitions(actions)
}
