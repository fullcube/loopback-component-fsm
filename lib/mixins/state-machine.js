'use strict'

const debug = require('debug')('loopback:component:fsm')

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
      },

      // Persist the updated state in the database.
      onenter: function onenter(options) {
        debug(`Finalizing state: ${options.to}`)
        return options.instance.updateAttribute(stateProperty, options.to)
          .then(result => {
            options.res = result
            return options
          })
      },

      // Transition is complete and events can be triggered safely.
      onentered: function onentered(options) {
        debug(`State is now: ${options.to}`)
        return options
      },
    },
  }

  // [
  //   { "name": "activate", "from": "none", "to": "active" },
  //   { "name": "cancel", "from": "active", "to": "canceled" },
  //   { "name": "reactivate", "from": "canceled", "to": "active" },
  //   { "name": "expire", "from": [ "active", "canceled" ], "to": "expired" }
  // ]

  const handlers = [ ]

  // FIXME: Need a better wat to get all state and event names for use in this loop.
  settings.events.forEach(config => {
    handlers.push(`onleave${config.to}`)
    handlers.push(`on${config.name}`)
    handlers.push(`onenter${config.to}`)
    handlers.push(`onentered${config.to}`)
  })

  handlers.forEach(handler => {
    Model.__FSM_CONFIG__.callbacks[handler] = function runHandler(options) {
      debug('Calling %s: %o', handler, options)
      return Model.notifyObserversOf(`fsm:${handler}`, options)
        .then(result => Object.assign(options, result))
    }
  })

  debug('Initialized events: %o', Model.__FSM_CONFIG__.events)
  debug('Initialized handlers: %o', handlers)
}
