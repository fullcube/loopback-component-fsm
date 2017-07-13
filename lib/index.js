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

  function getModelName(instance) {
    return instance.constructor.definition.name
  

  function generateCacheKey(instance) {
    if (!instance.id) {
      return null
    }
    const modelName = getModelName(instance)

    return `loopback-component-fsm.${modelName}.id:${instance.id}`
  }

  /**
   * Fetch cached state machine for an instance.
   */
  function getStateMachine(instance) {
    if (!instance.id) {
      return null
    }

    const modelName = getModelName(instance)
    const cacheKey = generateCacheKey(instance)
    let cache = _.get(app.locals, cacheKey)

    if (cache) {
      debug('Fetched cached state machine for instance %s (cache key=%s)', instance.id, cacheKey)
      return cache
    }
    debug('No cached state machine for instance %s (cache key=%s)', instance.id, cacheKey)

    let config = getStateMachineConfig(modelName)

    if (!config) {
      throw new Error(`${modelName} does not have state machine support.`)
    }

    let stateProperty = config.stateProperty;

    config = Object.assign(config, { initial: instance[stateProperty] })
    cache = new StateMachine(config)
    debug('Created new state machine for instance %s with config %o', instance.id, config)

    debug('Caching state machine for instance %s', instance.id)
    _.set(app.locals, cacheKey, cache)

    return cache
  }


  /**
   * Fetch cached state machine for an instance.
   */
  function deleteStateMachine(instance) {
    if (!instance.id) {
      return null
    }

    const cacheKey = generateCacheKey(instance)

    debug('Deleting cached state machine for subscription %s (cache key=%s)', instance.id, cacheKey)

    if (!_.get(app.locals, cacheKey)) {
      debug('Existing cached state machine not for instance %s (cache key=%s)', instance.id, cacheKey)
      return false
    }

    _.unset(app.locals, cacheKey)
    debug('Deleted cached state machine for subscription %s (cache key=%s)', instance.id, cacheKey)
    return true
  }

  app.getStateMachine = getStateMachine
  app.deleteStateMachine = deleteStateMachine
}
