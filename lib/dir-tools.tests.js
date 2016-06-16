'use strict'

// Core
let path = require('path')

// Vendor
let expect = require('chai').expect

// Local
let dirTools = require('./dir-tools')

describe('dirTools', function() {
	describe('directoryListing', function() {
		it('undefined directory throws error', function() {
			expect(function() {
				dirTools.directoryListing()
			}).throw(Error)
		})

		it('non-existent directory throws error', function() {
			expect(function() {
				dirTools.directoryListing(path.resolve(__dirname, 'non-existent-directory'))
			}).throw(Error)
		})

		it('returns object with parent directory, array of files, and array of subDirectories',
		function() {
			let directory = path.resolve(__dirname, '..'),
				result = dirTools.directoryListing(directory)
			
			expect(result).deep.equal({
				directory,
				files: [
					'.gitignore',
					'LICENSE',
					'README.md',
					'index.js',
					'package.json'
				],
				subDirectories: [
					'.git',
					'lib',
					'node_modules'
				]
			})
		})
	})

	describe('traverseDirectory', function() {
		it('undefined directory throws error', function() {
			expect(function() {
				dirTools.traverseDirectory()
			}).throw(Error)
		})

		it('non-existent directory throws error', function() {
			expect(function() {
				dirTools.traverseDirectory(path.resolve(__dirname, 'non-existent-directory'))
			}).throw(Error)
		})

		it('recursively calls callback with listing', function() {
			let results = []
			
			dirTools.traverseDirectory(__dirname, (listing) => results.push(listing))
			expect(results).deep.equal([
				{
					directory: __dirname,
					files: [
						'PathRoutifier.js',
						'PathRoutifier.tests.js',
						'dir-tools.js',
						'dir-tools.tests.js'
					],
					subDirectories: [
						'test-folder'
					]
				},
				{
					directory: path.resolve(__dirname, 'test-folder'),
					files: [
						'.gitignore'
					],
					subDirectories: []
				}
			])
		})
	})
})
