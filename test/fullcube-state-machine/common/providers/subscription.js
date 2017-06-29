'use strict'

const Promise = require('bluebird')
const log = require('loglevel')

log.enableAll()

module.exports = class FcSubscription {
  constructor(instance) {
    this.instance = instance
  }
  activate() {
    return Promise.delay(100).then(() => {
      log.info(`Subscription ${this.instance.id} activated`)
    })
  }

  cancel() {
    return Promise.delay(100).then(() => {
      log.info(`Subscription ${this.instance.id} canceled`)
    })
  }

  reactivate() {
    return Promise.delay(100).then(() => {
      log.info(`Subscription ${this.instance.id} reactivated`)
    })
  }

  expire() {
    return Promise.delay(100).then(() => {
      log.info(`Subscription ${this.instance.id} expired`)
    })
  }
}
