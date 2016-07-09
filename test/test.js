'use strict'

const Promise = require('bluebird')
const path = require('path')
const chai = require('chai')
const sinon = require('sinon')

chai.use(require('sinon-chai'))

require('sinon-as-promised')(Promise)

const expect = chai.expect

const TEST_APP = path.join(__dirname, 'fullcube-state-machine')
const app = require(path.join(TEST_APP, 'server/server.js'))

const FcSubscription = require(path.join(TEST_APP, 'common/providers/subscription'))

sinon.stub(FcSubscription.prototype, 'cancel').resolves()
sinon.stub(FcSubscription.prototype, 'reactivate').resolves()
sinon.stub(FcSubscription.prototype, 'expire').resolves()

const Subscription = app.models.Subscription

describe('Componenet', function() {
  describe('Initialization', function() {
    it('should add a getStateMachine method to the app', function() {
      expect(app).to.itself.respondTo('getStateMachine')
    })
  })
})

describe('Mixin', function() {
  describe('Initialization', function() {
    it('should add the model state machine config to Model.__FSM_CONFIG__', function() {
      expect(Subscription).to.have.property('__FSM_CONFIG__')
    })
  })
})

describe('State changes', function() {
  beforeEach(function() {
    return Subscription.create({ status: 'active' })
      .then(subscription => {
        this.subscription = subscription
      })
  })

  describe('Cancel (allowed from active)', function() {
    it('Should save the final state', function() {
      return this.subscription.cancel()
        .then(subscription => {
          expect(subscription).to.have.property('status', 'canceled')
        })
    })
  })

  describe('Expire (allowed from active)', function() {
    it('Should save the final state', function() {
      return this.subscription.expire()
        .then(subscription => {
          expect(subscription).to.have.property('status', 'expired')
        })
    })
  })

  describe('Reactivate (not allowed from active)', function() {
    it('Should raise an error and not save the final state', function() {
      return this.subscription.reactivate()
        .then(() => Promise.reject(new Error('Should not get this far')))
        .catch(err => {
          expect(err).to.have.property('message', 'Invalid event in current state')
          return this.subscription.reload().then(subscription => {
            expect(subscription).to.have.property('status', 'active')
          })
        })
    })
  })
})

describe('Observers', function() {
  const event = 'cancel'
  const from = 'active'
  const to = 'canceled'
  const observers = [
    `fsm:onleave${from}`,
    'fsm:onleave',
    `fsm:on${event}`,
    `fsm:onenter${to}`,
    'fsm:onenter',
    `fsm:onentered${to}`,
    'fsm:onentered',
  ]
  const observersThatRan = []

  before(function() {observers.forEach(observer => {
      // Clear out all existing observers for this test.
      Subscription.clearObservers(observer)

      // Set up a new observer that we can track.
      Subscription.observe(observer, ctx => {
        observersThatRan.push(observer)
        return Promise.resolve(ctx)
      })
    })
  })

  before(function() {
    return Subscription.create({ status: 'active' })
      .then(subscription => subscription.cancel())
  })

  describe('Cancel', function() {
    observers.forEach(observer => {
      it(`should run the ${observer} observer`, function() {
        expect(observersThatRan).to.include(observer)
      })
    })
  })
})
