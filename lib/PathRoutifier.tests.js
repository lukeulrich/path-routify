/* eslint-disable no-new, global-require, no-magic-numbers */

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
	kTestRootRoutingPath = path.resolve(__dirname, '..', 'test-data', 'routing'),
	kTestRootRoutingErrorPath = path.resolve(__dirname, '..', 'test-data', 'routing-errors')

describe('PathRoutifier', function() {
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

		let errorInputs = [
			{
				subDirectory: 'no-function-exports',
				description: 'handler module does not export anything'
			},
			{
				subDirectory: 'invalid-export',
				description: 'handler module with array export (non function)'
			},
			{
				subDirectory: 'invalid-return',
				description: 'handler module returns invalid value (not a function or array)'
			},
			{
				subDirectory: 'caret-with-star',
				description: 'caret prefix may not be applied to star file handlers'
			}
		]

		errorInputs.forEach((errorInput) => {
			it(errorInput.description + ' throws error', function() {
				let app = express(),
					x = new PathRoutifier(app)

				expect(function() {
					x.routify(path.resolve(kTestRootRoutingErrorPath, errorInput.subDirectory))
				}).throw(Error)
			})
		})

		describe('routes', function() {
			function test(app, method, url, expectedResult) {
				return request(app)[method](url)
					.expect((res) => {
						expect(res.body).a('array')
						expect(res.body[0]).equal('all /*')
						res.body.shift()
						expect(res.body).deep.equal(expectedResult)
					})
			}

			describe('default supported methods', function() {
				let app = express(),
					x = new PathRoutifier(app, {logger}),
					middlewares = {
						jsonBody: function(req, res, next) {
							res.locals.stack.push('mw:jsonBody')
							next()
						},
						validToken: function(req, res, next) {
							res.locals.stack.push('mw:validToken')
							next()
						}
					},
					router = x.routify(kTestRootRoutingPath, middlewares)

				app.use(router)

				function get(...params) {
					return test(app, 'get', ...params)
				}
				function post(...params) {
					return test(app, 'post', ...params)
				}
				function put(...params) {
					return test(app, 'put', ...params)
				}
				function del(...params) {
					return test(app, 'delete', ...params)
				}
				function patch(...params) {
					return test(app, 'patch', ...params)
				}

				describe('basic', function() {
					it('head / returns 404', function() {
						request(app).head('/')
							.expect(404)
					})

					it('get /', function() {
						return get('/', ['get /'])
					})

					it('post /', function() {
						return post('/', ['post /'])
					})

					it('get /wildcard', function() {
						return get('/wildcard', ['get /wildcard*', 'get /wildcard'])
					})

					it('get /wildcard/nested', function() {
						return get('/wildcard/nested', ['get /wildcard*', 'get /wildcard/nested'])
					})

					it('get /owners', function() {
						return get('/owners', ['get /owners'])
					})

					it('delete /owners', function() {
						return del('/owners', ['delete /*', 'delete /owners'])
					})

					it('get /skills (returns array of callbacks)', function() {
						return get('/skills', ['get /skills(1)', 'get /skills(2)'])
					})

					it('get /colors (returns numeric prefixed route)', function() {
						return get('/colors', ['get /colors(1)'])
					})

					it('jsonBody middleware added inside post handler', function() {
						return post('/skills', ['mw:jsonBody', 'post /skills'])
					})

					it('route middleware modification', function() {
						return patch('/skills', ['patch /skills'])
					})

					it('middleware modification is isolated from other requests', function() {
						return patch('/skills', ['patch /skills'])
							.then(() => patch('/skills/expert', [
								'mw:validToken',
								'patch /skills/expert'
							]))
					})
				})

				describe('parameters', function() {
					it('get /owners/34', function() {
						return get('/owners/34', ['get /owners/34'])
					})

					it('delete /owners/99', function() {
						return del('/owners/99', ['delete /*', 'delete /owners/99'])
					})

					it('put /owners/marley/dogs/300', function() {
						return put('/owners/marley/dogs/300', ['put /owners/marley/dogs/300'])
					})
				})

				describe('route middleware (^...)', function() {
					it('^auth get /users', function() {
						return get('/users', ['all ^auth/', 'get ^auth/', 'get /users'])
					})

					it('^auth post /users', function() {
						return post('/users', ['all ^auth/', 'post /users'])
					})

					it('get /owners/25/(^protected)/accounts', function() {
						return get('/owners/25/accounts', [
							'all /owners/25/(^protected)',
							'get /owners/25/accounts'
						])
					})

					it('post /owners/25/(^protected)/accounts', function() {
						return post('/owners/25/accounts', [
							'all /owners/25/(^protected)',
							'post /owners/25/(^protected)',
							'post /owners/25/accounts'
						])
					})
				})
			})

			describe('supported methods: get, delete', function() {
				let app = express(),
					x = new PathRoutifier(app, {
						logger,
						methods: [
							'get',
							'delete'
						]
					}),
					router = x.routify(kTestRootRoutingPath)

				app.use(router)

				function get(...params) {
					return test(app, 'get', ...params)
				}
				function del(...params) {
					return test(app, 'delete', ...params)
				}

				it('post / returns 404', function() {
					request(app).post('/')
						.expect(404)
				})

				it('get /', function() {
					return get('/', ['get /'])
				})

				it('delete /owners', function() {
					return del('/owners', ['delete /*', 'delete /owners'])
				})
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
