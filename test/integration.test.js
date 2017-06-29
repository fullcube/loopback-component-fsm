'use strict'

const path = require('path')
const chai = require('chai')
const lt = require('loopback-testing')
const request = require('supertest')

chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))

const { expect } = chai

const TEST_APP = path.join(__dirname, 'fullcube-state-machine')
const app = require(path.join(TEST_APP, 'server/server.js'))

chai.use(require('dirty-chai'))

// Helper function to make api requests.
function json(verb, reqUrl) {
  return request(app)[verb](reqUrl)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
}

describe('REST', function() {

  lt.beforeEach.withApp(app)

  describe('Basic handling', function() {
    lt.beforeEach.givenModel('Order', {}, 'order')
    it('Should return the updated order', function() {
      return json('put', `/api/orders/${this.order.id}/cancel`)
        .send()
        .expect(200)
        .then(res => expect(res.body.status).to.equal('canceled'))
    })
  })

  describe('Error handling', function() {
    lt.beforeEach.givenModel('Order', {}, 'order')
    it('Should return the rejected error', function() {
      return json('put', `/api/orders/${this.order.id}/disable`)
        .send()
        .expect(405)
        .then(res => {
          expect(res.error).to.have.property('message')
          expect(res.body.error).to.have.property('message', 'Disable method is not yet allowed')
        })
    })
  })

})
