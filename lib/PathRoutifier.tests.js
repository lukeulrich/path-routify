/* eslint-disable no-new, global-require */

'use strict'

// Core
let path = require('path')

// Vendor
let bunyan = require('bunyan'),
	expect = require('chai').expect,
	express = require('express')

// Local
let PathRoutifier = require('./PathRoutifier')

// Constants
let kTestRootPath = path.resolve(__dirname, '..', 'test-data')

describe.only('PathRoutifier', function() {
	let app = express(),
		logger = bunyan.createLogger({
			name: 'PathRoutifierTester',
			stream: process.stdout
		})

	describe('constructor', function() {
		it('express application and no options', function() {
			new PathRoutifier(app)
		})

		it('all options', function() {
			new PathRoutifier(app, {
				logger,
				autoNameAnonymousMiddleware: true
			})
		})
	})

	describe('loadMiddlewares', function() {
		it('conflicting name gives precedence to file', function() {
			let x = new PathRoutifier(app),
				testPath = path.resolve(kTestRootPath, 'conflicting-name'),
				result = x.loadMiddlewares(testPath)

			replaceFnsWithNames(result)

			expect(result).deep.equal({
				misc: 'misc'
			})
		})

		it('assigns automatic name to function if autoNameAnonymousMiddleware is true', function() {
			let x = new PathRoutifier(app, {autoNameAnonymousMiddleware: true}),
				testPath = path.resolve(kTestRootPath, 'auto-naming'),
				result = x.loadMiddlewares(testPath)

			replaceFnsWithNames(result)

			expect(result).deep.equal({
				named: 'specialName',
				unnamed: 'unnamed',
				unnamedMultiple: 'unnamedMultiple'
			})
		})

		it('')
	})

	describe('routify', function() {
	})
})

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
