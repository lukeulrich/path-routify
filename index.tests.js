'use strict'

// Core
const path = require('path')

// Vendor
const bunyan = require('bunyan'),
	expect = require('chai').expect,
	express = require('express'),
	request = require('supertest-as-promised')

// Local
const pathRoutify = require('./index')

describe('path-routify', function() {
	it('generates express routes', function() {
		let app = express(),
			logger = bunyan.createLogger({name: 'indexTester', stream: process.stdout}),
			router = pathRoutify(app, path.resolve(__dirname, 'test-data', 'routing-simple'),
				{logger})

		app.use(router)

		return request(app).get('/activities')
			.then((res) => {
				expect(res.body).deep.equal([
					'get /activities'
				])
			})
	})
})
