import { InstanceBase, Regex, runEntrypoint, TCPHelper } from '@companion-module/base'
import { updateActions } from './actions.js'
import { updateFeedbacks } from './feedback.js'
import { updateVariables } from './variables.js'
import MxwApi from './internalAPI.js'
import { Choices, Models } from './setup.js'

/**
 * Companion instance class for the Shure Wireless Microphones.
 *
 * @extends InstanceBase
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 */
class ShureMxwInstance extends InstanceBase {
	/**
	 * Create an instance of a shure WX module.
	 *
	 * @param {Object} internal - Companion internals
	 */
	constructor(internal) {
		super(internal)

		this.updateActions = updateActions.bind(this)
		this.updateFeedbacks = updateFeedbacks.bind(this)
		this.updateVariables = updateVariables.bind(this)
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 */
	async configUpdated(config) {
		let resetConnection = false
		let cmd

		if (this.config.host != config.host) {
			resetConnection = true
		}

		if (this.config.meteringOn !== config.meteringOn) {
			if (config.meteringOn === true) {
				cmd = `< SET 0 METER_RATE ${this.config.meteringInterval} >`
			} else {
				cmd = '< SET 0 METER_RATE 0 >'
			}
		} else if (this.config.meteringRate != config.meteringRate && this.config.meteringOn === true) {
			cmd = `< SET 0 METER_RATE ${config.meteringInterval} >`
		}

		this.config = config

		if (Models[this.config.modelID] !== undefined) {
			this.model = Models[this.config.modelID]
		} else {
			this.log('debug', `Shure Model: ${this.config.modelID} NOT FOUND`)
		}

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariables()

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP()
		} else if (cmd !== undefined) {
			this.socket.send(cmd)
		}
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.heartbeatInterval !== undefined) {
			clearInterval(this.heartbeatInterval)
		}

		if (this.heartbeatTimeout !== undefined) {
			clearTimeout(this.heartbeatTimeout)
		}

		this.log('debug', 'destroy', this.id)
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 */
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				default: 2202,
				width: 2,
				regex: Regex.PORT,
			},
			{
				type: 'dropdown',
				id: 'modelID',
				label: 'Model Type',
				choices: Choices.Models,
				width: 6,
				default: 'mxwapt8',
			},
			{
				type: 'checkbox',
				id: 'meteringOn',
				label: 'Enable Metering?',
				width: 2,
				default: true,
			},
			{
				type: 'number',
				id: 'meteringInterval',
				label: 'Metering Interval (in ms)',
				width: 4,
				min: 500,
				max: 99999,
				default: 5000,
				required: true,
			},
			{
				type: 'dropdown',
				id: 'variableFormat',
				label: 'Variable Format',
				choices: [
					{ id: 'units', label: 'Include Units' },
					{ id: 'numeric', label: 'Numeric Only' },
				],
				width: 6,
				default: 'units',
				tooltip:
					'Changing this setting will apply to new values received.  To refresh all variables with the new setting, disable and re-enable the connection after saving these settings.',
			},
		]
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @param {Object} config - the configuration
	 */
	async init(config) {
		this.config = config
		this.model = {}
		this.deviceName = ''
		this.initDone = false

		this.heartbeatInterval = null
		this.heartbeatTimeout = null

		this.CHOICES_CHANNELS = []
		this.CHOICES_CHANNELS_A = []

		if (this.config.modelID !== undefined) {
			this.model = Models[this.config.modelID]
		} else {
			this.config.modelID = 'mxwapt8'
			this.model = Models['mxwapt8']
		}

		this.updateStatus('disconnected', 'Connecting')

		this.api = new MxwApi(this)

		this.setupFields()

		this.updateActions()
		this.updateVariables()
		this.updateFeedbacks()

		this.initTCP()
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp socket object.
	 */
	initTCP() {
		this.receivebuffer = ''

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.heartbeatInterval !== undefined) {
			clearInterval(this.heartbeatInterval)
		}

		if (this.heartbeatTimeout !== undefined) {
			clearTimeout(this.heartbeatTimeout)
		}

		if (this.config.port === undefined) {
			this.config.port = 2202
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('error', `Network error: ${err.message}`)
			})

			this.socket.on('connect', () => {
				this.log('debug', 'Connected')
				let cmd = '< GET 0 ALL >'
				this.socket.send(cmd)

				if (this.config.meteringOn === true) {
					cmd = `< SET 0 METER_RATE ${this.config.meteringInterval} >`
					this.socket.send(cmd)
				}

				this.heartbeatInterval = setInterval(() => {
					this.socket.send('< GET 1 METER_RATE >')
				}, 30000)
			})

			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				let i = 0,
					line = '',
					offset = 0
				this.receivebuffer += chunk

				while ((i = this.receivebuffer.indexOf('>', offset)) !== -1) {
					line = this.receivebuffer.substr(offset, i - offset)
					offset = i + 1
					this.socket.emit('receiveline', line.toString())
				}

				this.receivebuffer = this.receivebuffer.substr(offset)
			})

			this.socket.on('receiveline', (line) => {
				this.processShureCommand(line.replace('< ', '').trim())

				if (line.match(/METER_RATE/)) {
					if (this.heartbeatTimeout !== undefined) {
						clearTimeout(this.heartbeatTimeout)
					}

					this.heartbeatTimeout = setTimeout(this.initTCP.bind(this), 60000)
				}
			})
		}
	}

	/**
	 * INTERNAL: Routes incoming data to the appropriate function for processing.
	 *
	 * @param {string} command - the command/data type being passed
	 */
	processShureCommand(command) {
		if ((typeof command === 'string' || command instanceof String) && command.length > 0) {
			let commandArr = command.split(' ')
			let commandType = commandArr.shift()
			let commandNum = parseInt(commandArr[0])

			let joinData = function (commands, start) {
				let out = ''
				if (commands.length > 0) {
					for (let i = start; i < commands.length; i++) {
						out += commands[i] + ' '
					}
				}
				return out.trim()
			}

			if (commandType == 'REP') {
				//this is a report command

				if (isNaN(commandNum) && commandArr[0] != 'PRI' && commandArr[0] != 'SEC') {
					//this command isn't about a specific channel
					this.api.updateReceiver(commandArr[0], joinData(commandArr, 1))
				} else if (commandArr[0] == 'PRI') {
					//this command is about a specific channel
					this.api.updateChannel(commandNum, commandArr[2], joinData(commandArr, 3))
				} else if (commandArr[0] == 'SEC') {
					//ignore sec commands in MXW
				} else if (commandArr[1] == 'LED_STATUS') {
					//this command is led status for a MXW channel
					this.api.updateChannel(commandNum, commandArr[1], commandArr[2] + ',' + commandArr[3])
				} else {
					//this command is about a specific channel
					this.api.updateChannel(commandNum, commandArr[1], joinData(commandArr, 2))
				}
			} else if (commandType == 'SAMPLE') {
				//this is a sample command
				this.api.parseSample(commandNum, command)
			}
		}
	}

	/**
	 * INTERNAL: send a command to the receiver.
	 */
	sendCommand(cmd) {
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.isConnected) {
				this.socket.send(`< ${cmd} >`)
			} else {
				this.log('debug', 'Socket not connected :(')
			}
		}
	}

	/**
	 * INTERNAL: use model data to define the channel choicess.
	 */
	setupChannelChoices() {
		this.CHOICES_CHANNELS = []
		this.CHOICES_CHANNELS_A = []

		if (this.model.channels > 1) {
			this.CHOICES_CHANNELS_A.push({ id: '0', label: 'All Channels' })
		}

		for (let i = 1; i <= this.model.channels; i++) {
			let data = `Channel ${i}`

			if (this.api.getChannel(i).name != '') {
				data += ' (' + this.api.getChannel(i).name + ')'
			}

			this.CHOICES_CHANNELS.push({ id: i, label: data })
			this.CHOICES_CHANNELS_A.push({ id: i, label: data })
		}

		this.CHANNELS_FIELD.choices = this.CHOICES_CHANNELS
		this.CHANNELS_A_FIELD.choices = this.CHOICES_CHANNELS_A
	}

	/**
	 * Set up the fields used in actions and feedbacks
	 */
	setupFields() {
		this.CHANNELS_FIELD = {
			type: 'dropdown',
			label: 'Channel',
			id: 'channel',
			default: '1',
			choices: this.CHOICES_CHANNELS,
		}
		this.CHANNELS_A_FIELD = {
			type: 'dropdown',
			label: 'Channel',
			id: 'channel',
			default: '1',
			choices: this.CHOICES_CHANNELS_A,
		}
	}
}

runEntrypoint(ShureMxwInstance, [])
