'use strict'

const Promise = require('bluebird')
const StateMachine = require('fsm-as-promised')
const _ = require('lodash')
const debug = require('debug')('loopback:component:fsm')

StateMachine.Promise = Promise

module.exports = function loopbackComponentFsm(app) {
  /**
   * Get the state machine config for a given model.
   */
  function getStateMachineConfig(modelName) {
    const Model = app.loopback.findModel(modelName)

    return Model ? Model.__FSM_CONFIG__ : null
  }

  /**
   * Fetch cached state machine for an instance.
   */
  function getStateMachine(instance) {
    const modelName = instance.constructor.definition.name
    const cacheKey = [ 'fullcube.StateMachine', modelName, instance.id ].join('.')
    let cache = _.get(app.locals, cacheKey)

    debug('Fetching cached state machine found for subscription %s (cache key=%s)', instance.id, cacheKey)

    if (!cache) {
      debug('No cached state machine found for subscription', instance.id)
      let config = getStateMachineConfig(modelName)

      if (!config) {
        throw new Error(`${modelName} does not have state machine support.`)
      }

      config = Object.assign(config, { initial: instance.status })
      cache = new StateMachine(config)
      _.set(app.locals, cacheKey, cache)
    }

    return cache
  }

  app.getStateMachine = getStateMachine
}
