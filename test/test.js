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

describe('Component', function() {
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

describe('Validation', function() {
  const validStatuses = [
    'none',
    'active',
    'canceled',
    'expired',
  ]

  describe('Valid statuses', function() {
    validStatuses.forEach(validStatus => {
      it(`should allow to create a subscription with status ${validStatus}`, function() {
        return Subscription.create({ status: validStatus })
          .then(subscription => expect(subscription).to.have.property('status', validStatus))
      })
    })
  })

  describe('Invalid status', function() {
    it('should not allow to create a subscription with an unknown status', function() {
      return Subscription.create({ status: 'unknown' })
        .catch(err => {
          expect(err).to.have.property('name', 'ValidationError')
          expect(err).to.have.property('message', 'The `Subscription` instance is not valid. Details: `status` is not included in the list (value: \"unknown\").')
          expect(err).to.have.property('statusCode', 422)
        })
    })
  })
})

describe('Get event states and names', function() {

  const testEvents = [
    { name: 'activate', from: [ 'none' ], to: 'active' },
    { name: 'cancel', from: 'active', to: 'canceled' },
    { name: 'reactivate', from: 'canceled', to: 'active' },
    { name: 'expire', from: [ 'none', 'active', 'canceled' ], to: 'expired' },
    { name: 'expire', from: '*', to: 'expired' },
  ]

  it('should extract the event states', function(done) {
    const stateEvents = Subscription.getEventStates(testEvents)

    expect(stateEvents.length).to.equal(4)
    expect(stateEvents).to.include('none', 'active', 'canceled', 'expired')
    done()
  })

  it('should extract the event names', function(done) {
    const stateNames = Subscription.getEventNames(testEvents)

    expect(stateNames.length).to.equal(4)
    expect(stateNames).to.include('activate', 'cancel', 'reactivate', 'expire')
    done()
  })

})
