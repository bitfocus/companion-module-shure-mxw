/**
 * INTERNAL: initialize variables.
 */
export function updateVariables() {
	let variables = []

	for (let i = 1; i <= this.model.channels; i++) {
		let prefix = `ch_${i}`

		variables.push({ variableId: `${prefix}_name`, name: `Channel ${i} Name` })
		variables.push({ variableId: `${prefix}_meter_rate`, name: `Channel ${i} Meter Rate` })
		variables.push({ variableId: `${prefix}_audio_gain`, name: `Channel ${i} Audio Gain` })
		variables.push({ variableId: `${prefix}_int_audio_gain`, name: `Channel ${i} Internal Microphone Gain` })
		//variables.push({ variableId: `${prefix}_flash`, name: `Channel ${i} Flash` });
		variables.push({ variableId: `${prefix}_rf_level`, name: `Channel ${i} RF Level` })
		variables.push({ variableId: `${prefix}_audio_level`, name: `Channel ${i} Audio Level` })
		variables.push({ variableId: `${prefix}_tx_model`, name: `Channel ${i} Transmitter Model` })
		variables.push({ variableId: `${prefix}_tx_device_id`, name: `Channel ${i} Transmitter Device ID` })
		variables.push({ variableId: `${prefix}_tx_available`, name: `Channel ${i} Transmitter Available` })
		variables.push({ variableId: `${prefix}_tx_status`, name: `Channel ${i} Transmitter Status` })
		variables.push({ variableId: `${prefix}_tx_power_source`, name: `Channel ${i} Transmitter Power Source` })
		variables.push({ variableId: `${prefix}_tx_talk_switch`, name: `Channel ${i} Transmitter Mute Button Status` })
		variables.push({ variableId: `${prefix}_battery_charge`, name: `Channel ${i} Battery Charge Status` })
		variables.push({ variableId: `${prefix}_battery_health`, name: `Channel ${i} Battery Health` })
		variables.push({ variableId: `${prefix}_battery_runtime`, name: `Channel ${i} Battery Run Time` })
		variables.push({ variableId: `${prefix}_battery_time_to_full`, name: `Channel ${i} Battery Type` })
		variables.push({ variableId: `${prefix}_led_status_green`, name: `Channel ${i} Green LED Status` })
		variables.push({ variableId: `${prefix}_led_status_red`, name: `Channel ${i} Red LED Status` })
		variables.push({ variableId: `${prefix}_bp_mic_select`, name: `Channel ${i} BP Mic Select` })
	}

	variables.push({ variableId: 'device_id', name: 'Device ID' })
	variables.push({ variableId: 'flash', name: 'Flash Lights On/Off' })

	this.setVariableDefinitions(variables)
}
