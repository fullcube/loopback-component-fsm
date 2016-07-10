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
  const fromState = 'active'
  const toState = 'canceled'
  const observers = [
    `fsm:onleave${fromState}`,
    'fsm:onleave',
    `fsm:on${event}`,
    `fsm:onenter${toState}`,
    'fsm:onenter',
    `fsm:onentered${toState}`,
    'fsm:onentered',
  ]
  const observersThatRan = []

  before(function() {
    observers.forEach(observer => {
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
          expect(err.message).to.include('`status` is not included in the list (value: \"unknown\").')
          expect(err).to.have.property('statusCode', 422)
        })
    })
  })
})

describe('Utility', function() {
  const testEvents = [
    { name: 'activate', from: [ 'none' ], to: 'active' },
    { name: 'cancel', from: 'active', to: 'canceled' },
    { name: 'reactivate', from: 'canceled', to: 'active' },
    { name: 'expire', from: [ 'none', 'active', 'canceled' ], to: 'expired' },
    { name: 'expire', from: '*', to: 'expired' },
  ]

  describe('getEventStates', function() {
    it('should extract the event states', function() {
      const stateEvents = Subscription.getEventStates(testEvents)

      expect(stateEvents.length).to.equal(4)
      expect(stateEvents).to.include('none', 'active', 'canceled', 'expired')
    })
  })

  describe('getEventNames', function() {
    it('should extract the event names', function() {
      const stateNames = Subscription.getEventNames(testEvents)

      expect(stateNames.length).to.equal(4)
      expect(stateNames).to.include('activate', 'cancel', 'reactivate', 'expire')
    })
  })
})

describe('Cache', function() {
  beforeEach(function() {
    delete app.locals['loopback-component-fsm']
  })

  describe('Add to cache', function() {
    const subscription = new Subscription({
      id: 1,
      status: 'active',
    })

    it('should create and cache a new state machine', function() {
      const fsm = app.getStateMachine(subscription)

      expect(app.locals).to.have.deep.property('loopback-component-fsm.Subscription.id:1', fsm)
    })
  })

  describe('Remove from cache', function() {
    const subscription = new Subscription({
      id: 1,
      status: 'active',
    })

    it('should delete an existing state machine from the cache', function() {
      app.getStateMachine(subscription)
      app.deleteStateMachine(subscription)
      expect(app.locals).to.not.have.deep.property('loopback-component-fsm.Subscription.id:1')
    })
  })

  describe('Use cache through transition', function() {
    beforeEach(function() {
      return Subscription.create({ status: 'active' })
        .then(subscription => {
          this.subscription = subscription
        })
    })

    it('should delete the state machine on completion', function() {
      return this.subscription.cancel()
        .then(() => {
          expect(app.locals).to.not.have.deep.property(`loopback-component-fsm.Subscription.id:${this.subscription.id}`)
        })
    })

    it('should reuse an existing state machine if one is in use', function(done) {

      // Make the subscription.cancel method take 100ms second to run.
      Subscription.observe('fsm:oncancel', ctx => Promise.delay(100).return(ctx))

      // Start a cancelation.
      this.subscription.cancel()
        .then(() => {
          expect(app.locals).to.not.have.deep.property(`loopback-component-fsm.Subscription.id:${this.subscription.id}`)
          done()
        })

      // Start another cancel in 50ms (whilst the other is still running).
      Promise.delay(50).then(() => this.subscription.cancel())
        .then(() => Promise.reject(new Error('Should not get this far')))
        .catch(err => {
          expect(err).to.have.property('message', 'Previous transition pending')
        })
    })
  })
})
