'use strict'

// Core
const path = require('path')

// Vendor
const expect = require('chai').expect

// Local
const dirTools = require('./dir-tools')

// Constants
const kTestRootPath = path.resolve(__dirname, '..', 'test-data', 'dir-tools')

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
			let result = dirTools.directoryListing(kTestRootPath)

			expect(result).deep.equal({
				directory: kTestRootPath,
				files: [
					'.hidden-file',
					'normal.txt',
					'other.txt'
				],
				subDirectories: [
					'.hidden-directory',
					'high-priority'
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

			dirTools.traverseDirectory(kTestRootPath, (listing) => results.push(listing))
			expect(results).deep.equal([
				{
					directory: kTestRootPath,
					files: [
						'.hidden-file',
						'normal.txt',
						'other.txt'
					],
					subDirectories: [
						'.hidden-directory',
						'high-priority'
					]
				},
				{
					directory: path.resolve(kTestRootPath, '.hidden-directory'),
					files: [
						'.gitignore'
					],
					subDirectories: []
				},
				{
					directory: path.resolve(kTestRootPath, 'high-priority'),
					files: [
						'.gitignore'
					],
					subDirectories: []
				}
			])
		})
	})
})
