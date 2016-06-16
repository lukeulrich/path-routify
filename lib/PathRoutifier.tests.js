/* eslint-disable no-new */

'use strict'

// Core
let path = require('path')

// Vendor
let bunyan = require('bunyan'),
	expect = require('chai').expect,
	express = require('express')

// Local
let PathRoutifier = require('./PathRoutifier')

describe('PathRoutifier', function() {
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
	})

	describe('routify', function() {
	})
})
