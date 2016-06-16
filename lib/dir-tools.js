'use strict'

// Core
let fs = require('fs'),
	path = require('path')

/**
 * @typedef {Object} Listing
 * @property {String} directory parent directory containing files and subDirectories
 * @property {Array.<String>} files lexically sorted fileNames contained in ${directory}
 * @property {Array.<String>} subDirectories lexically sorted sub-directories contained in
 *   ${directory} (excluding . and ..)
 */

/**
 * @callback listingCallback
 * @param {Listing}
 */

/**
 * Synchronously reads all files and sub-directories immediately under ${directory} and returns
 * an object containing this information:
 *
 * @param {String} directory the source path to obtain a directory listing
 * @returns {Listing}
 */
exports.directoryListing = function(directory) {
	let files = [],
		subDirectories = []

	fs.readdirSync(directory)
	.forEach((fileName) => {
		if (fileName === '.' || fileName === '..')
			return

		let fullPath = path.resolve(directory, fileName),
			stats = fs.statSync(fullPath)

		if (stats.isFile())
			files.push(fileName)
		else if (stats.isDirectory())
			subDirectories.push(fileName)
	})

	files.sort()
	subDirectories.sort()

	return {
		directory,
		files,
		subDirectories
	}
}

/**
 * Synchronously and recursively traverses ${directory} and all sub-directories, calling
 * ${callbackFn} with a Listing for each directory scanned.
 *
 * @param {String} directory the source path to begin traversing
 * @param {listingCallback} callbackFn
 */
exports.traverseDirectory = function(directory, callbackFn) {
	let listing = exports.directoryListing(directory)
	callbackFn(listing)
	listing.subDirectories.forEach((subDirectory) => {
		let fullPath = path.resolve(directory, subDirectory)
		exports.traverseDirectory(fullPath, callbackFn)
	})
}
