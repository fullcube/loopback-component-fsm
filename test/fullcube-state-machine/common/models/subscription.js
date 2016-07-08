const FcSubscription = require('../providers/subscription')
const assert = require('assert')
const log = require('fullcube-logger')
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback

module.exports = function SubscriptionModel(Subscription) {
  Subscription.observe('fsm:oncancel', ctx => {
    log.debug('fsm:oncancel')
    return new FcSubscription(ctx.instance).cancel()
      .then(() => ctx)
  })

  Subscription.observe('fsm:onreactivate', ctx => {
    log.debug('fsm:onreactivate')
    return new FcSubscription(ctx.instance).reactivate()
      .then(() => ctx)
  })

  Subscription.observe('fsm:onexpire', ctx => {
    log.debug('fsm:onexpire')
    return new FcSubscription(ctx.instance).expire()
      .then(() => ctx)
  })

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
