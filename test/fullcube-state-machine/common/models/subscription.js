const FcSubscription = require('../providers/subscription')

module.exports = function SubscriptionModel(Subscription) {
  // Subscription.observe('fsm:oncancel', ctx => new FcSubscription(ctx.instance).cancel().then(() => ctx))
  //
  // Subscription.observe('fsm:onreactivate', ctx => new FcSubscription(ctx.instance).reactivate().then(() => ctx))
  //
  // Subscription.observe('fsm:onexpire', ctx => new FcSubscription(ctx.instance).expire().then(() => ctx))
}
