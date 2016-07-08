const log = require('fullcube-logger')

module.exports.FcMembership = class FcMembership {
  constructor(provider) {
    this.provider = provider || 'fullcube'
  }

  activate() {
    return Promise.delay(500).then(() => {
      log.info(`${this.provider} Membership activated`)
    })
  }

  terminate() {
    return Promise.delay(500).then(() => {
      log.info(`${this.provider} Membership terminated`)
    })
  }
}
