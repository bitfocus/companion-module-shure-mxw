import { combineRgb } from '@companion-module/base'
import { Fields } from './setup.js'

/**
 * INTERNAL: initialize feedbacks.
 */
export function updateFeedbacks() {
	// feedbacks
	let feedbacks = {}

	feedbacks['battery_level'] = {
		type: 'boolean',
		name: 'Battery Level',
		description: 'If the battery bar drops to or below a certain value, change the color of the button.',
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		options: [this.CHANNELS_FIELD, Fields.BatteryLevel],
		callback: ({ options }) => {
			if (this.api.getChannel(parseInt(options.channel)).batteryBars <= options.barlevel) {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['channel_muted'] = {
		type: 'boolean',
		label: 'Channel Muted',
		description: 'If the selected channel is muted, change the color of the button.',
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(128, 0, 0),
		},
		options: [this.CHANNELS_FIELD],
		callback: ({ options }) => {
			if (this.api.getChannel(parseInt(options.channel)).audioMute == 'ON') {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['channel_gain'] = {
		type: 'boolean',
		name: 'Channel Gain',
		description: "If the selected channel's gain is set, change the color of the button.",
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 255, 0),
		},
		options: [this.CHANNELS_FIELD, Fields.GainSet],
		callback: ({ options }) => {
			if (this.api.getChannel(parseInt(options.channel)).audioGain == options.gain) {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['microphone_gain'] = {
		type: 'boolean',
		name: 'Microphone Gain',
		description: "If the selected microphone's gain is set, change the color of the button.",
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 255, 0),
		},
		options: [this.CHANNELS_FIELD, Fields.GainSet],
		callback: ({ options }) => {
			if (this.api.getChannel(parseInt(options.channel)).intAudioGain == options.gain) {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks['transmitter_turned_off'] = {
		type: 'boolean',
		name: 'Transmitter Turned Off',
		description: "If the selected channel's transmitter is powered off, change the color of the button.",
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 128),
		},
		options: [this.CHANNELS_FIELD],
		callback: ({ options }) => {
			if (this.api.getChannel(parseInt(options.channel)).txType == 'Unknown') {
				return true
			} else {
				return false
			}
		},
	}

	this.setFeedbackDefinitions(feedbacks)
}
