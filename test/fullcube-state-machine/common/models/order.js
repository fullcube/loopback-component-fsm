'use strict'

const Promise = require('bluebird')
const log = require('loglevel')

log.enableAll()

module.exports = function OrderModel(Order) {
  // Prepare
  Order.observe('fsm:oneprepare', ctx => {
    log.info(`Preparing order ${ctx.instance.id}`)
    return Promise.delay(100)
  })
  Order.observe('fsm:onenteredprepared', ctx => {
    log.info(`Sucessfully prepared order ${ctx.instance.id}`)
    return Promise.resolve(ctx)
  })

  // Cancel
  Order.observe('fsm:oncancel', ctx => {
    log.info(`Canceling order ${ctx.instance.id}`)
    return Promise.delay(100)
  })
  Order.observe('fsm:onenteredcanceled', ctx => {
    log.info(`Sucessfully canceled order ${ctx.instance.id}`)
    return Promise.resolve(ctx)
  })

  // Deliver
  Order.observe('fsm:ondeliver', ctx => {
    log.info(`Delivering order ${ctx.instance.id}`)
    return Promise.delay(100)
  })
  Order.observe('fsm:onentereddelivered', ctx => {
    log.info(`Sucessfully delivered order ${ctx.instance.id}`)
    return Promise.resolve(ctx)
  })

}
