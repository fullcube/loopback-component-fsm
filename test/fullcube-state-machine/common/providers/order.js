'use strict'

const Promise = require('bluebird')
const log = require('loglevel')

log.enableAll()

module.exports = class FcOrder {
  constructor(instance) {
    this.instance = instance
  }
  prepare() {
    return Promise.delay(2000).then(() => {
      log.info(`Order ${this.instance.id} prepared`)
    })
  }

  cancel() {
    return Promise.delay(2000).then(() => {
      log.info(`Order ${this.instance.id} canceled`)
    })
  }

  deliver() {
    return Promise.delay(2000).then(() => {
      log.info(`Order ${this.instance.id} delivered`)
    })
  }
}
