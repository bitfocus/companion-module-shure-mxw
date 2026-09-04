const LedStatus = {
	ON: 'On',
	OF: 'Off',
	ST: 'Strobe',
	FL: 'Flash',
	PU: 'Pulse',
}

/**
 * Companion instance API class for Shure Microflex Wireless.
 * Utilized to track the state of the receiver and channels.
 *
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 */
export default class MxwApi {
	/**
	 * Create an instance of a Shure API module.
	 *
	 * @param {instance} instance - the parent instance
	 */
	constructor(instance) {
		this.instance = instance

		//mxw   [DEVICE_ID,FLASH]
		this.receiver = {
			deviceId: '', // 31
			flash: 'OFF', // OFF - ON
		}
		this.channels = []
	}

	/**
	 * Returns the desired channel state object.
	 *
	 * @param {number} id - the channel to fetch
	 * @returns {Object} the desired channel object
	 * @access public
	 */
	getChannel(id) {
		if (this.channels[id] === undefined) {
			//mxw   rx [CHAN_NAME,METER_RATE,AUDIO_GAIN,FLASH]
			//mxw   tx [TX_TYPE,TX_AVAILABLE,TX_STATUS,BUTTON_STS,LED_STATUS,BATT_CHARGE,BATT_HEALTH,BATT_RUN_TIME,BATT_TIME_TO_FULL,BP_MIC_SELECT,INT_AUDIO_GAIN]
			this.channels[id] = {
				//rx
				name: '', // 31
				meterRate: 0, // 0=disabled, 100-99999 [in ms]
				audioGain: 0, // 0-40,-25dB
				flash: 'OFF', // OFF - ON

				//tx
				txType: 'Unknown', // MXW1 - MXW2 - MXW6 - MXW8 - UNKNOWN
				txDeviceId: 'Unknown', // 12
				txAvailable: 'NO', // YES - NO
				txStatus: 'Unknown', // ACTIVE[set] - MUTE[set] - STANDBY[set] - ON_CHARGER - UNKNOWN - OFF[set-only]
				txTalkSwitch: 'Unknown', // (BUTTON_STS) OFF=RELEASED - ON=PRESSED - UNKNOWN
				txPowerSource: 'Unknown', // SEE batteryRuntime
				ledStatusRed: 'Off', // rr gg (rr) ON=On,OF=Off,ST=Strobe,FL=Flash,PU=Pulse,NC=No Change
				ledStatusGreen: 'Off', // rr gg (gg) ON=On,OF=Off,ST=Strobe,FL=Flash,PU=Pulse,NC=No Change
				batteryCharge: 255, // 0-100, 255=UNKNg
				batteryHealth: 255, // 0-100, 255=UNKN
				batteryRuntime: 65535, // 0+, 65535=UNKN 65534=calcuating 65533=charging 65532=wall power
				batteryRuntime2: 'Unknown', // Text representation of batteryRuntime
				batteryTimeToFull: 65535, // 0+, 65535=UNKN (not charging), 65534=charged
				bpMicSelect: 'Unknown', // INT=Internal, EXT=External, AUTO=Auto, ERR=Not a bodypack, UNKNOWN
				intAudioGain: 0, // 0-40,-25dB
			}
		}

		return this.channels[id]
	}

	/**
	 * Returns the receiver state object.
	 *
	 * @returns {Object} the receiver state object
	 * @access public
	 */
	getReceiver() {
		return this.receiver
	}

	/**
	 * Parse sample data for MXW.
	 *
	 * @param {number} id - the channel id
	 * @param {String} data - the sample data
	 * @access public
	 */
	parseSample(id, data) {
		let channel = this.getChannel(id)
		let prefix = 'ch_' + id + '_'
		let sample = data.split(' ')

		channel.rfLevel = parseInt(sample[1])
		channel.audioLevel = parseInt(sample[2])

		this.instance.setVariableValues({
			[`${prefix}rf_level`]: channel.rfLevel,
			[`${prefix}audio_level`]: channel.audioLevel,
		})
	}

	/**
	 * Update a channel property.
	 *
	 * @param {number} id - the channel id
	 * @param {String} key - the command id
	 * @param {String} value - the new value
	 * @access public
	 */
	updateChannel(id, key, value) {
		let channel = this.getChannel(id)
		let prefix = 'ch_' + id + '_'
		let variable

		if (value == 'UNKN' || value == 'UNKNOWN') {
			value = 'Unknown'
		}

		if (key == 'CHAN_NAME') {
			channel.name = value.replace('{', '').replace('}', '').trim()
			this.instance.setVariableValues({ [`${prefix}name`]: channel.name })
			this.instance.updateActions()
			this.instance.updateFeedbacks()
		} else if (key == 'METER_RATE') {
			channel.meterRate = parseInt(value)
			if (channel.meterRate == 0) {
				variable = 'Disabled'
			} else {
				variable = channel.meterRate + (this.instance.config.variableFormat == 'units' ? ' ms' : '')
			}
			this.instance.setVariableValues({ [`${prefix}meter_rate`]: variable })
		} else if (key == 'AUDIO_GAIN') {
			channel.audioGain = parseInt(value) - 25
			variable =
				(channel.audioGain > 0 ? '+' : '') +
				channel.audioGain.toString() +
				(this.instance.config.variableFormat == 'units' ? ' dB' : '')
			this.instance.setVariableValues({ [`${prefix}audio_gain`]: variable })
			this.instance.checkFeedbacks('channel_gain')
		} else if (key == 'INT_AUDIO_GAIN') {
			channel.intAudioGain = parseInt(value) - 25
			variable =
				(channel.intAudioGain > 0 ? '+' : '') +
				channel.intAudioGain.toString() +
				(this.instance.config.variableFormat == 'units' ? ' dB' : '')
			this.instance.setVariableValues({ [`${prefix}int_audio_gain`]: variable })
			this.instance.checkFeedbacks('microphone_gain')
		} else if (key == 'FLASH') {
			channel.flash = value
			//this.instance.setVariableValues({[`${prefix}flash`]: value});
		} else if (key == 'TX_AVAILABLE') {
			if (channel.txAvailable != value && value == 'YES') {
				//poll for tx when becoming available (per Shure spec)
				this.instance.sendCommand('< GET ' + id + ' TX_STATUS >')
				this.instance.sendCommand('< GET ' + id + ' TX_DEVICE_ID >')
				this.instance.sendCommand('< GET ' + id + ' AUDIO_GAIN >')
				this.instance.sendCommand('< GET ' + id + ' BATT_RUN_TIME >')
				this.instance.sendCommand('< GET ' + id + ' TX_BATT_CHARGE >')
				this.instance.sendCommand('< GET ' + id + ' BATT_HEALTH >')
				this.instance.sendCommand('< GET ' + id + ' BUTTON_STS >')
				this.instance.sendCommand('< GET ' + id + ' LED_STATUS >')
				this.instance.sendCommand('< GET ' + id + ' TX_TYPE >')
				this.instance.sendCommand('< GET ' + id + ' BP_MIC_SELECT >')
			}
			channel.txAvailable = value
			this.instance.setVariableValues({ [`${prefix}tx_available`]: value })
		} else if (key == 'TX_STATUS') {
			channel.txStatus = value
			this.instance.setVariableValues({ [`${prefix}tx_status`]: value })
			this.instance.checkFeedbacks('channel_muted')
		} else if (key == 'TX_TYPE') {
			channel.txType = value
			this.instance.setVariableValues({ [`${prefix}tx_model`]: value })
			this.instance.checkFeedbacks('transmitter_turned_off')
		} else if (key == 'TX_DEVICE_ID') {
			channel.txDeviceId = value.replace('{', '').replace('}', '').trim()
			this.instance.setVariableValues({ [`${prefix}tx_device_id`]: channel.txDeviceId })
			this.instance.checkFeedbacks('slot_is_active')
		} else if (key == 'BUTTON_STS') {
			switch (value) {
				case 'OFF':
					variable = 'RELEASED'
					break
				case 'ON':
					variable = 'PRESSED'
					break
				default:
					variable = value
					break
			}
			channel.txTalkSwitch = variable
			this.instance.setVariableValues({ [`${prefix}tx_talk_switch`]: variable })
		} else if (key == 'BP_MIC_SELECT') {
			switch (value) {
				case 'INT':
					variable = 'Internal'
					break
				case 'EXT':
					variable = 'External'
					break
				case 'ERR':
					variable = 'Error'
					break
				case 'AUTO':
					variable = 'Auto'
					break
				default:
					variable = value
					break
			}
			channel.bpMicSelect = variable
			this.instance.setVariableValues({ [`${prefix}bp_mic_select`]: variable })
		} else if (key == 'LED_STATUS') {
			variable = value.split(',')
			if (variable[0] != 'NC') {
				channel.ledStatusRed = variable[0]
				this.instance.setVariableValues({ [`${prefix}led_status_red`]: LedStatus[variable[0]] })
			}
			if (variable[1] != 'NC') {
				channel.ledStatusGreen = variable[1]
				this.instance.setVariableValues({ [`${prefix}led_status_green`]: LedStatus[variable[1]] })
			}
		} else if (key == 'TX_BATT_CHARGE') {
			channel.batteryCharge = parseInt(value)
			if (channel.batteryCharge == 255) {
				variable = 'Unknown'
			} else {
				variable = value + (this.instance.config.variableFormat == 'units' ? '%' : '')
			}
			this.instance.setVariableValues({ [`${prefix}battery_charge`]: variable })
		} else if (key == 'BATT_HEALTH') {
			channel.batteryHealth = parseInt(value)
			if (channel.batteryHealth == 255) {
				variable = 'Unknown'
			} else {
				variable = value + (this.instance.config.variableFormat == 'units' ? '%' : '')
			}
			this.instance.setVariableValues({ [`${prefix}battery_health`]: variable })
		} else if (key == 'BATT_RUN_TIME') {
			channel.batteryRuntime = parseInt(value)
			if (channel.batteryRuntime == 65535) {
				variable = 'Unknown'
				channel.txPowerSource = 'Unknown'
			} else if (channel.batteryRuntime == 65534) {
				variable = 'Calculating'
				channel.txPowerSource = 'BATTERY'
			} else if (channel.batteryRuntime == 65533) {
				variable = 'Charging'
				channel.txPowerSource = 'EXTERNAL'
			} else if (channel.batteryRuntime == 65532) {
				variable = 'Wall Power'
				channel.txPowerSource = 'EXTERNAL'
			} else {
				let mins = channel.batteryRuntime
				let h = Math.floor(mins / 60)
				let m = mins % 60
				m = m < 10 ? '0' + m : m
				variable = `${h}:${m}`
			}

			this.instance.setVariableValues({ [`${prefix}tx_power_source`]: channel.txPowerSource })
			channel.batteryRuntime2 = variable
			this.instance.setVariableValues({ [`${prefix}battery_runtime`]: variable })
		} else if (key == 'BATT_TIME_TO_FULL') {
			channel.batteryTimeToFull = parseInt(value)
			if (channel.batteryTimeToFull == 65535) {
				variable = 'Unknown'
			} else if (channel.batteryTimeToFull == 65534) {
				variable = 'Charged'
			} else {
				let mins = channel.batteryTimeToFull
				let h = Math.floor(mins / 60)
				let m = mins % 60
				m = m < 10 ? '0' + m : m
				variable = `${h}:${m}`
			}
			this.instance.setVariableValues({ [`${prefix}battery_time_to_full`]: variable })
		}
	}

	/**
	 * Update a receiver property.
	 *
	 * @param {String} key - the command id
	 * @param {String} value - the new value
	 * @access public
	 */
	updateReceiver(key, value) {
		if (value == 'UNKN' || value == 'UNKNOWN') {
			value = 'Unknown'
		}

		if (key == 'DEVICE_ID') {
			this.receiver.deviceId = value.replace('{', '').replace('}', '').trim()
			this.instance.setVariableValues({ device_id: this.receiver.deviceId })
		} else if (key == 'FLASH') {
			this.receiver.flash = value
			//this.instance.setVariableValues({'flash': value});
		}
	}
}
