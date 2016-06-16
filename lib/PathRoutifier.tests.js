/* eslint-disable no-new, global-require */

'use strict'

// Core
let path = require('path')

// Vendor
let bunyan = require('bunyan'),
	expect = require('chai').expect,
	express = require('express'),
	request = require('supertest-as-promised')

// Local
let PathRoutifier = require('./PathRoutifier')

// Constants
let kTestRootMiddlewarePath = path.resolve(__dirname, '..', 'test-data', 'middlewares'),
	kTestRootRoutingPath = path.resolve(__dirname, '..', 'test-data', 'routing')

describe.only('PathRoutifier', function() {
	let logger = bunyan.createLogger({
		name: 'PathRoutifierTester',
		stream: process.stdout
	})

	describe('constructor', function() {
		it('express application and no options', function() {
			let app = express()
			new PathRoutifier(app)
		})

		it('all options', function() {
			let app = express()
			new PathRoutifier(app, {
				logger,
				autoNameAnonymousMiddleware: true
			})
		})
	})

	describe('loadMiddlewares', function() {
		it('conflicting name gives precedence to file', function() {
			let app = express(),
				x = new PathRoutifier(app),
				testPath = path.resolve(kTestRootMiddlewarePath, 'conflicting-name'),
				result = x.loadMiddlewares(testPath)

			replaceFnsWithNames(result)

			expect(result).deep.equal({
				misc: 'misc'
			})
		})

		it('assigns automatic name to function if autoNameAnonymousMiddleware is true', function() {
			let app = express(),
				x = new PathRoutifier(app, {autoNameAnonymousMiddleware: true}),
				testPath = path.resolve(kTestRootMiddlewarePath, 'auto-naming'),

				result = x.loadMiddlewares(testPath)

			replaceFnsWithNames(result)

			expect(result).deep.equal({
				named: 'specialName',
				unnamed: 'unnamed',
				unnamedMultiple: 'unnamedMultiple'
			})
		})

		it('keys are camel-cased', function() {
			let app = express(),
				x = new PathRoutifier(app, {autoNameAnonymousMiddleware: true}),
				testPath = path.resolve(kTestRootMiddlewarePath, 'camel-case'),

				result = x.loadMiddlewares(testPath)

			replaceFnsWithNames(result)

			expect(result).deep.equal({
				authUsers: {
					userExists: 'userExists'
				},
				shouldCamelCase: 'shouldCamelCase',
				underScoresWork: 'underScoresWork'
			})
		})
	})

	describe('routify', function() {
		it('empty routesPath throws error', function() {
			let app = express(),
				x = new PathRoutifier(app)
			expect(function() {
				x.routify()
			}).throw(Error)
		})

		it('non-existent value for routesPath throws error', function() {
			let app = express(),
				x = new PathRoutifier(app)
			expect(function() {
				x.routify(path.resolve(__dirname, 'non-existent-directory'))
			}).throw(Error)
		})

		describe('routes', function() {
			let app = express(),
				x = new PathRoutifier(app, {logger}),
				router = x.routify(kTestRootRoutingPath)

			app.use(router)

			function test(method, url, expectedResult) {
				return request(app)[method](url)
					.expect((res) => {
						expect(res.body).deep.equal(expectedResult)
					})
			}
			function get(...params) {
				return test('get', ...params)
			}
			function post(...params) {
				return test('get', ...params)
			}
			function put(...params) {
				return test('get', ...params)
			}
			function del(...params) {
				return test('get', ...params)
			}

			it('get /', function() {
				return get('/', ['all /*', 'get /'])
			})
		})
	})
})

/**
 * Recursively modifies ${sourceObj} by replacing any values that are functions with their
 * function name. Used to facilitate checking a nested structure of functions (e.g. middlewares).
 *
 * @param {Object} sourceObj
 */
function replaceFnsWithNames(sourceObj) {
	for (let key in sourceObj) {
		let type = typeof sourceObj[key]
		switch (type) {
			case 'function':
				sourceObj[key] = sourceObj[key].name
				break
			case 'object':
				replaceFnsWithNames(sourceObj[key])
				break

			default:
				throw new Error('Object values restricted to either functions or another object')
		}
	}
}
