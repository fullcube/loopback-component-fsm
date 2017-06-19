'use strict'

const debug = require('debug')('loopback:component:fsm')
const _ = require('lodash')

module.exports = function StateMachine(Model, settings) {
  debug('initializing FMS Mixin for model %s', Model.modelName)

  const stateProperty = settings.stateProperty || 'state'

  // Initialize the main StateMachine config.
  Model.__FSM_CONFIG__ = {
    events: settings.events,
    callbacks: {
      // When leaving any state, grab the initial model instance and set in options for eacy access.
      onleave: function onleave(options) {
        debug(`Leaving state: ${options.from}`)
        options.instance = options.args[0]
        delete options.args[0]
        return Model.notifyObserversOf('fsm:onleave', options)
          .then(result => Object.assign(options, result))
      },

      // Persist the updated state in the database.
      onenter: function onenter(options) {
        debug(`Finalizing state: ${options.to}`)
        let transitionOptions = null
        const eventOptions = _.find(settings.events, { 'name': options.name })

        if (eventOptions && eventOptions.transitionOptions) {
          transitionOptions = eventOptions.transitionOptions
        }

        return options.instance.updateAttribute(stateProperty, options.to, transitionOptions)
          .then(result => {
            options.instance = result
            return Model.notifyObserversOf('fsm:onenter', options)
          })
          .then(result => Object.assign(options, result))
      },

      // Transition is complete and events can be triggered safely.
      onentered: function onentered(options) {
        debug(`State is now: ${options.to}`)
        return Model.notifyObserversOf('fsm:onentered', options)
          .then(result => {
            // Return either the instance, or whatever was put in options.res
            options.res = options.res || result.instance
            return options
          })
      },
    },
  }

  /**
   * Extract all the possible events from the 'from' and 'to' keys in the state array
   */
  Model.getEventStates = function getEventStates(events) {
    const result = []

    // Loop through the defined events
    events.forEach(event => {
      // Ignore a value un from that is not a valid state
      if (event.from === '*') {
        return
      }
      // Create an array if 'from' is a string value
      if (typeof event.from === 'string') {
        event.from = [ event.from ]
      }
      // Get states for each of the items in the 'from' array
      event.from.forEach(from => result.push(from))
      // Get the 'to' state
      result.push(event.to)
    })
    // Return the unique values in the results
    return _.uniq(result)
  }

  /**
   * Extract the names of the events
   */
  Model.getEventNames = function getEventNames(events) {
    const result = []

    // Loop through the defined events and get the name of the state
    events.forEach(event => result.push(event.name))

    // Return the unique values in the results
    return _.uniq(result)
  }

  // Get the valid event states and names
  const validStates = Model.getEventStates(settings.events)
  const validNames = Model.getEventNames(settings.events)

  debug('Valid event states for property "%s": %o', settings.stateProperty, validStates)
  debug('Valid event names for property "%s": %o', settings.stateProperty, validNames)

  // Create the array of handlers based on all valid event states and names
  const handlers = [ ]

  validStates.forEach(validState => {
    handlers.push(`onleave${validState}`)
    handlers.push(`onenter${validState}`)
    handlers.push(`onentered${validState}`)
  })

  validNames.forEach(validName => handlers.push(`on${validName}`))

  // Add validation that only allows values defined in the events
  Model.validatesInclusionOf(settings.stateProperty, { in: validStates })

  handlers.forEach(handler => {
    Model.__FSM_CONFIG__.callbacks[handler] = function runHandler(options) {
      debug('Calling %s: %o', handler, options)
      return Model.notifyObserversOf(`fsm:${handler}`, options)
        .then(result => {
          debug('Result from %s: %o', handler, result)
          return result
        })
    }
  })

  debug('Initialized events: %o', Model.__FSM_CONFIG__.events)
  debug('Initialized handlers: %o', handlers)

  // Add event methods to the prototype.
  Model.getEventNames(settings.events).forEach(eventName => {
    Model.prototype[eventName] = function event(...args) {
      const eventNameIndex = _.findKey(settings.events, { 'name': eventName })

      if (args[0] && args[0].force && (settings.settings && settings.settings.allowForce) ||
      (settings.events[eventNameIndex].settings && settings.events[eventNameIndex].settings.allowForce)) {
        // Set the current eventName as allowed from event in settings
        _.assign(settings.events[eventNameIndex].from, [ this.status ])
      }
      const fms = Model.app.getStateMachine(this)

      return fms[eventName](this, ...args)
        .then(result => result)
        .finally(() => Model.app.deleteStateMachine(this))
    }
  })
}
