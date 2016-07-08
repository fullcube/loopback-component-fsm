const FcSubscription = require('../providers/subscription')
const assert = require('assert')
const log = require('fullcube-logger')
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback

module.exports = function SubscriptionModel(Subscription) {
  Subscription.STATEMACHINE = {
    events: [
      { name: 'activate', from: 'none', to: 'active' },
      { name: 'cancel', from: 'active', to: 'canceled' },
      { name: 'reactivate', from: 'canceled', to: 'active' },
      { name: 'expire', from: [ 'active', 'canceled' ], to: 'expired' },
    ],
    callbacks: {
      // Handle the activate transition.
      onactivate: function onactivate(options) {
        log.debug(`Starting ${options.name}...`)
        const provider = new FcSubscription(options.instance)

        return provider.activate()
          .then(() => options)
      },

      // Handle the cancel transition.
      oncancel: function oncancel(options) {
        log.debug(`Starting ${options.name}...`)
        const provider = new FcSubscription(options.instance)

        return provider.cancel()
          .then(() => options)
      },

      // Handle the reactivate transition.
      onreactivate: function onreactivate(options) {
        log.debug(`Starting ${options.name}...`)
        const provider = new FcSubscription(options.instance)

        return provider.reactivate()
          .then(() => options)
      },

      // Handle the expire transition.
      onexpire: function onexpire(options) {
        log.debug(`Starting ${options.name}...`)
        const provider = new FcSubscription(options.instance)

        return provider.expire()
          .then(() => options)
      },

      // When leaving any state, grab the initial model instance and set in options for eacy access.
      onleave: function onleave(options) {
        options.instance = options.args[0]
      },

      // Persist the updated status in the database.
      onenter: function onenter(options) {
        log.debug(`finalizing state: ${options.to}`)
        return options.instance.updateAttribute('status', options.to)
          .then(result => {
            options.res = result
            return options
          })
      },

      // Transition is complete and events can be triggered safely.
      onentered: function onentered(options) {
        log.debug(`state is now: ${options.to}`)
        return options
      },
    },
  }

  /**
   * Cancel a subscription
   * @param {Function(Error)} callback
   */
  Subscription.prototype.cancel = function cancel(cb) {
    cb = cb || createPromiseCallback()
    assert(typeof cb === 'function', 'The cb argument must be a function')

    Subscription.app.getStateMachine(this).cancel(this)
      .then(res => cb(null, res))
      .catch(cb)

    return cb.promise
  }

  /**
   * Reactive a canceled subscription
   * @param {Function(Error, )} callback
   */
  Subscription.prototype.reactivate = function reactivate(cb) {
    cb = cb || createPromiseCallback()
    assert(typeof cb === 'function', 'The cb argument must be a function')

    Subscription.app.getStateMachine(this).reactivate(this)
      .then(res => cb(null, res))
      .catch(cb)

    return cb.promise
  }

  /**
   * Expire a subscription
   * @param {Function(Error, )} callback
   */
  Subscription.prototype.expire = function reactivate(cb) {
    cb = cb || createPromiseCallback()
    assert(typeof cb === 'function', 'The cb argument must be a function')

    Subscription.app.getStateMachine(this).expire(this)
      .then(res => cb(null, res))
      .catch(cb)

    return cb.promise
  }
}
