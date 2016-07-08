const Promise = require('bluebird')
const log = require('fullcube-logger')

module.exports = class FcSubscription {
  constructor(instance) {
    this.provider = instance.provider
  }

  activate() {
    return Promise.delay(5000).then(() => {
      log.info(`${this.provider} subscription activated`)
    })
  }

  cancel() {
    return Promise.delay(5000).then(() => {
      log.info(`${this.provider} subscription canceled`)
    })
  }

  reactivate() {
    return Promise.delay(5000).then(() => {
      log.info(`${this.provider} subscription reactivated`)
    })
  }

  expire() {
    return Promise.delay(5000).then(() => {
      log.info(`${this.provider} subscription expired`)
    })
  }
}
