'use strict'

// Core
const path = require('path')

// Vendor
const bunyan = require('bunyan')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')

// Local
const pathRoutify = require('./index')

describe('path-routify', function() {
	it('generates express routes', function() {
		const app = express()
		const logger = bunyan.createLogger({name: 'indexTester', streams: []})
		const router = pathRoutify(app, path.resolve(__dirname, 'test-data', 'routing-simple'), {logger})

		app.use(router)

		return request(app).get('/activities')
			.then((res) => {
				expect(res.body).eql([
					'get /activities'
				])
			})
	})
})
