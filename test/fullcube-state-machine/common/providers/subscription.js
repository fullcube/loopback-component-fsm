const Promise = require('bluebird')
const log = require('fullcube-logger')

module.exports = class FcSubscription {
  constructor(instance) {
    this.provider = instance.provider
  }

  activate() {
    return Promise.delay(5000).then(() => {
      log.info('subscription activated')
    })
  }

  cancel() {
    return Promise.delay(5000).then(() => {
      log.info('subscription canceled')
    })
  }

  reactivate() {
    return Promise.delay(5000).then(() => {
      log.info('subscription reactivated')
    })
  }

  expire() {
    return Promise.delay(5000).then(() => {
      log.info('subscription expired')
    })
  }
}
