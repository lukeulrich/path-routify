/**
 * # Introduction
 * PathRoutifier transforms a directory structure into a set of express routes corresponding to a
 * directory layout. Thus, the directory layout handily reflects the supported RESTful routes. Main
 * features include:
 *
 * - Arbitrary middlewares both globally and per-route
 * - Route middleware for all child routes
 * - URL parameters
 * - Wildcard routes (e.g. /users/:id*)
 * - Per route manipulation of parent middlewares
 *
 * The path of a route directly maps to its directory path, and the handler for each HTTP method is
 * found in the file named with the relevant HTTP method:
 *
 * /users/$id/profile/get.js	--> GET /users/:id/profile
 * /users/$id/delete.js			--> DELETE /users/:id
 *
 * All handlers filenames must be in lowercase and named according to the HTTP method that they will
 * handle. Supported methods are those supported by Express (
 * http://expressjs.com/en/4x/api.html#app.METHOD). In addition to these verbs, 'all' may be used
 * to match all HTTP methods. As demonstrated in the above examples, parameters may be specified by
 * prefixing a directory with the dollar sign ($). PathRoutifier converts these to their express
 * equivalents using a leading colon (colons do not play well as directory names, thus, the dollar
 * sign was chosen as an alternative).
 *
 *
 * # Wildcard routes (.star.js)
 * In some cases, it is desirable to specify route handlers for all routes that include a wildcard
 * character (*). To specify these, simply suffix the relevant handler filename with '.star.js'.
 * For example, the path /users/$id/all.star.js becomes router.all('/users/:id*', ...).
 *
 *
 * # Route ordering
 * All routes are loaded in alphabetical order (e.g. all is before get which is before post). To
 * specify a different order, simply prefix the verb name with a number and a period such that
 * when lexically sorted, the desired order is achieved. For example, in the following paths, the
 * handlers will be loaded in the order listed below despite the verbs being lexically out of
 * order.
 *
 * /users/:id/1.get.js
 * /users/:id/2.delete.js
 * /users/:id/all.js
 * /users/:id/put.js
 *
 * The only exception to the lexical route ordering are wildcard paths. If both a HTTP method path
 * and a cognate wildcard path exist without any numeric prefix, then the wildcard path will be
 * added first. For example, even though the following paths are listed in their lexical sorted
 * order, all.star.js will be added first.
 *
 * /users/:id/all.js
 * /users/:id/all.star.js
 *
 * If the original lexical ordering is preferred, simply apply numerical prefixes as necessary (see
 * above).
 *
 * Directory names are also loaded according to their lexically sorted position; however, any
 * numeric prefix will also become part of the REST URL endpoint.
 *
 *
 * # Middleware that applies to all child routes
 * If a directory name begins with the caret symbol (^), it is considered a middleware directory and
 * any relevant middlewares will be executed before processing child routes. Middleware may be
 * set for all HTTP methods (all.js) or specific HTTP methods (e.g. get.js). Any file with a
 * numeric prefix or wildcard (.star.js) under a middleware directory will be ignored. Middleware
 * directory names are not included as part of the REST URL.
 *
 * ^auth/all.js			--> This middleware is executed before get /users and post /users
 * ^auth/users/get.js	--> get / post run after the ^auth/all.js middleware
 * ^auth/users/post.js
 *
 *
 * # Default middleware
 * It may be useful to specify a default middleware for all routes that match a given criteria. For
 * example, ensure that the body of all POST requests is valid JSON. This may be done simply and at
 * any level by prefixing the filename with a caret symbol (^) at the relevant point in the
 * directory hierarchy.
 *
 * /^post.js -> ensure body is valid json
 *
 * All handlers in this file are integrated into the middleware stack. No routes are explicitly
 * created for these handlers. Rather, these callbacks are injected before any routes that "flow"
 * through this virtual path and available for manipulation to each applicable route handler (via
 * the upstreamMiddleware argument). This makes it possible to define global or sub-global
 * middleware by default, yet enable specific routes to opt-out as needed.
 *
 * This differs from wildcard routes (.star.js), which though functionally similar, actually creates
 * an express route.
 *
 *
 * # Handler definitions
 * Each middleware or handler file is expected to return a function which when called returns the
 * function for handling this request. This looks like the following:
 *
 * // /users/get.js
 * /**
 *  * Handler function for a particular express generated route.
 *  *
 *  * @param {Express} app an express instance
 *  * @param {Object} middlewares all available middlewares (nested object)
 *  * @param {Array.<Function>} routeMiddlewares all middlewares that will be run prior to calling
 *  *   this handler function. May be modified as needed.
 *  * @returns {Function|Array.<Function>} a set of express-compatible route callback(s) (e.g.
 *  *   function(req, res, next) { ... })
 *  *\/
 * module.exports = function(app, middlewares, routeMiddlewares) {
 * 		// Optionally modify the current middleware stack
 * 		// routeMiddlewares.splice(routeMiddlewares.indexOf(middlewares.jsonBody), 1)
 *
 *		return function(req, res, next) {
 * 			...
 * 		}
 *
 * 		// Alternatively, return an array of callbacks
 * 		return [
 * 			middlewares.authenticate,
 * 			function(req, res, next) {
 *
 * 			}
 * 		]
 * }
 *
 *
 * # Middleware handler example
 * Middleware modules should export a function that accepts app and middlewares as arguments, and
 * returns an array or single express compatible functions.
 *
 * // /^auth/all.js
 * module.exports = function(app, middlewares) {
 *  	return function(req, res, next) {
 * 			...
 *  	}
 *
 *  	// Alernatively
 *   	return [
 *  		function(req, res, next) {
 *  			...
 *  		},
 *  		...
 *  	]
 * }
 *
 * Notes
 * - The middlewares argument is not available in global middlewares
 * - The middlewares object passed into each route handler (second argument) is an object tree that
 *   reflects a given directory structure. Internal nodes are directory names. Leaf keys are the
 *   "camelCased" file names inside each directory. Leaf values are the actual middleware callbacks.
 *
 *   For example, the following directory structure
 *
 *   /auth
 *   /auth/users
 *   /auth/users/valid-password.js
 *   /auth/has-account.js
 *   /misc
 *   /misc/valid-json.js
 *   /no-empty-body.js
 *
 *   will be transformed into the following object:
 *
 *   {
 *     auth: {
 *       users: {
 *         validPassword: function(...) {}
 *       },
 *       hasAccount: function(...) {}
 *     }
 *     misc: {
 *       validJson: function(...) {}
 *     },
 *     noEmptyBody: function(...) {}
 *   }
 *
 *   If the same basename is shared by both a file and directory (e.g. ./auth.js and ./auth/...),
 *   the immediate file middleware (auth.js) is ignored.
 *
 *   If options.autoNameAnonymousMiddleware is set to true (configured on instantiation), then any
 *   anonymous middleware callbacks will be named with its camel-cased base filename. This helps
 *   with revealing what middlewares are associated with each route in log messages.
 *
 *
 * # Logging
 * An optional bunyan style logger argument may be passed during construction. If present, all
 * processed routes will be logged at the INFO level (see bunyan docs for details). To further
 * improve logging, it is also advised to name global middlewares (those available to each handler
 * method) as these names will be displayed in relevant log messages. The option,
 * autoNameAnonymousMiddleware, may be used to automatically generate a name for anonymous callbacks
 * based on the middleware's filename.
 */
'use strict'

// Core
const assert = require('assert'),
	path = require('path')

// Vendor
const express = require('express'),
	inflection = require('inflection')

// Local
const dirTools = require('./dir-tools')

// Constants
const kMiddlewareDirectoryPrefix = '^',
	kParamDirectoryPrefix = '$'

module.exports =
class PathRoutifier {
	/**
	 * @constructor
	 * @param {Object} app express application instance
	 * @param {Object?} options
	 * @param {Logger?} options.logger a bunyan logger
	 * @param {Boolean?} options.autoNameAnonymousMiddleware
	 */
	constructor(app, options = {}) {
		this.app_ = app
		this.logger_ = options.logger
		this.autoNameAnonymousMiddleware_ = !!options.autoNameAnonymousMiddleware
		this.routesPath_ = null
		this.router_ = null
		this.middlewares_ = null

		// stack of middleware handlers by http method:
		// ${http method}: [${handlers}, ...]
		this.middlewaresStack_ = null
		this.routeStack_ = null
	}

	/**
	 * Recursively loads all middlewares contained beneath ${middlewaresPath}.
	 *
	 * @param {String} middlewaresPath
	 * @returns {Object} nested object reflective of the directory structure beneath
	 *   ${middlwaresPath}. The terminal key names are the "camelCased" file names found in each
	 *   directory whose values are the middleware callback functions (see above).
	 */
	loadMiddlewares(middlewaresPath) {
		let middlewares = {}
		if (!middlewaresPath)
			return middlewares

		dirTools.traverseDirectory(middlewaresPath, (listing) => {
			let relativePathToMiddleware = path.relative(middlewaresPath, listing.directory),
				directoriesToMiddleware = relativePathToMiddleware ?
					relativePathToMiddleware.split(path.sep) : null,
				ref = middlewares

			if (directoriesToMiddleware) {
				directoriesToMiddleware.forEach((subDirectory) => {
					let camelName = this.camelCase_(subDirectory)
					if (ref[camelName])
						ref = ref[camelName]
					else
						ref = ref[camelName] = {}
				})
			}

			// If a function already exists for this reference, then do not define any more
			let sameNameForFileAndSubDirectory = typeof ref === 'function'
			if (sameNameForFileAndSubDirectory) {
				let conflictingName = directoriesToMiddleware[directoriesToMiddleware.length - 1]
				this.log_({path: relativePathToMiddleware, conflictingName}, `Ignoring middleware directory, ${conflictingName}, because a file with this name also exists`)
				return
			}

			// Load all the middlewares using the dot notation
			listing.files
			.filter((fileName) => fileName.endsWith('.js'))
			.forEach((middlewareFileName) => {
				let middlewarePath = path.resolve(listing.directory, middlewareFileName),
					middlewareName = this.camelCase_(path.basename(middlewareFileName, '.js')),
					middlewarePathId = middlewareName

				if (directoriesToMiddleware)
					middlewarePathId = directoriesToMiddleware.join('.') + '.' + middlewareName

				// eslint-disable-next-line global-require
				ref[middlewareName] = require(middlewarePath)(this.app_)

				this.log_(`Initialized middleware: ${middlewarePathId}`)

				if (this.autoNameAnonymousMiddleware_ && !ref[middlewareName].name)
					Reflect.defineProperty(ref[middlewareName], 'name', {value: middlewareName})
			})
		})

		return middlewares
	}

	/**
	 * Recursively loads all middlewares located under ${optMiddlewaresPath} (if defined) and then
	 * generates express routes as described in the introduction that reflect the directory
	 * structure beneath ${routesPath}.
	 *
	 * @param {String} routesPath
	 * @param {Object?} optMiddlewares defaults to an empty object
	 * @returns {express.Router}
	 */
	routify(routesPath, optMiddlewares = {}) {
		this.routesPath_ = routesPath
		this.middlewares_ = optMiddlewares
		this.router_ = express.Router({ // eslint-disable-line new-cap
			caseSensitive: true,
			strict: true,
			mergeParams: true
		})

		// 1. Create the routes
		this.middlewaresStack_ = {}
		this.routeStack_ = []
		this.routifyRecurse_(this.routesPath_)

		// 2. Remove internal references (for memory optimization)
		this.middlewares_ = null
		this.middlewaresStack_ = null
		this.routeStack_ = null

		// 3. Return the router with all the associated routes
		return this.router_
	}

	// ----------------------------------------------------
	// Private methods
	/**
	 * Returns the camel-case representation of ${value}
	 *
	 * @param {String} value
	 * @returns {String}
	 */
	camelCase_(value) {
		let underscored = value.replace(/-/g, '_')
		return inflection.camelize(underscored, true /* lower first */)
	}

	/**
	 * @param {String} directory
	 * @param {Boolean?} isMiddlewareDirectory indicates if ${directory} only contains middlware;
	 *   defaults to false
	 */
	routifyRecurse_(directory, isMiddlewareDirectory = false) {
		let listing = dirTools.directoryListing(directory),
			sortedRouteInfos = this.sortRouteInfos_(listing)

		if (isMiddlewareDirectory)
			this.handleRouteMiddlewareDirectory_(listing, sortedRouteInfos)
		else
			this.handleRouteDirectory_(listing, sortedRouteInfos)
	}

	/**
	 * Decodes route information from the filename and adjusts any wildcard handlers' order.
	 *
	 * @param {Listing} listing
	 * @returns {Object}
	 */
	sortRouteInfos_(listing) {
		// 1. Build array of valid HTTP method file handlers and decode into its relevant parts
		let routeInfos = []
		listing.files.forEach((fileName) => {
			// 1a. Split into parts
			let matches = /^(\^)?(?:(\d+)\.)?([a-z]+)(\.star)?\.js$/.exec(fileName)
			if (!matches)
				return

			let routeInfo = {
				fileName,
				path: path.resolve(listing.directory, fileName),
				hasMiddlewarePrefix: !!matches[1],
				hasNumericPrefix: !!matches[2],
				httpMethod: matches[3],
				isStar: !!matches[4]
			}

			// 1b. Validation
			if (routeInfo.hasMiddlewarePrefix && routeInfo.isStar) {
				throw new Error(`Invalid route file: ${routeInfo.path}; wildcard handlers are ` +
					'not permitted to be tagged as middleware (prefixed with the caret ^ symbol).')
			}

			// 1c. Add to list
			routeInfos.push(routeInfo)
		})

		// 2. Order wildcard routes
		this.prioritizeStarRouteInfos_(routeInfos)

		return routeInfos
	}

	/**
	 * A lexically sorted set of files will place wildcard callbacks (e.g. get.star.js) after their
	 * cognate callback (e.g. get.js). Because it is desired to load wildcard middleware first, this
	 * function swaps the positions of any such occurrences in ${routeInfos}.
	 *
	 * @param {Array.<Object>} routeInfos lexically sorted set of route info objects
	 */
	prioritizeStarRouteInfos_(routeInfos) {
		for (let i = 0, z = routeInfos.length; i < z - 1; i++) {
			let current = routeInfos[i],
				next = routeInfos[i + 1],
				needToSwap = next.isStar &&
					current.httpMethod === next.httpMethod &&
					!current.hasNumericPrefix &&
					!next.hasNumericPrefix &&
					!current.hasMiddlewarePrefix &&
					!next.hasMiddlewarePrefix

			if (needToSwap) {
				routeInfos[i] = next
				routeInfos[i + 1] = current

				// Skip the next one because we have already processed it
				i++
			}
		}
	}

	/**
	 * @param {Listing} listing
	 * @param {Array.<Object>} routeInfos
	 */
	handleRouteMiddlewareDirectory_(listing, routeInfos) {
		// 1. Consider only legitimately named middlewares
		let mwRouteInfos = routeInfos.filter((x) =>
			!x.hasNumericPrefix &&
			!x.isStar &&
			!x.hasMiddlewarePrefix
		)

		// 2. Push onto the stack, http method specific middlewares
		this.pushMwRouteInfosOnStack_(mwRouteInfos)

		// 3. Recurse through all subDirectories
		this.recurseSubDirectories_(listing)

		// 4. Pop off the http method specific middlewares
		this.popMwRouteInfosOffStack_(mwRouteInfos)
	}

	/**
	 * ${mwRouteInfos} is an array of paths that when required and called, may also return an array
	 * of callbacks.
	 *
	 * @param {Array.<Object>} mwRouteInfos
	 */
	pushMwRouteInfosOnStack_(mwRouteInfos) {
		mwRouteInfos.forEach((routeInfo) => {
			let handlerModule = null,
				handlers = null
			try {
				// eslint-disable-next-line global-require
				handlerModule = require(routeInfo.path)
				if (typeof handlerModule !== 'function')
					throw new Error('Module did not export a function')
				handlers = toArray(handlerModule(this.app_, this.middlewares_))
			}
			catch (error) {
				this.log_({path: routeInfo.path}, `Error while loading middleware: ${routeInfo.httpMethod}: ${error.message}`)
				throw error
			}

			this.pushMwStack_(routeInfo.httpMethod, handlers)
		})
	}

	/**
	 * Pushes http method specific ${handlers} onto the middleware stack.
	 *
	 * @param {String} httpMethod
	 * @param {Function|Array.<Function>} handlers
	 */
	pushMwStack_(httpMethod, handlers) {
		if (!this.middlewaresStack_[httpMethod])
			this.middlewaresStack_[httpMethod] = []

		this.middlewaresStack_[httpMethod].push(handlers)
	}

	/**
	 * Inverse of @pushMwRouteInfosOnStack_
	 *
	 * @param {Array.<Object>} mwRouteInfos
	 */
	popMwRouteInfosOffStack_(mwRouteInfos) {
		mwRouteInfos.forEach((routeInfo) => this.popMwStack_(routeInfo.httpMethod))
	}

	/**
	 * Inverse of @popMwStack_
	 *
	 * @param {String} httpMethod
	 */
	popMwStack_(httpMethod) {
		this.middlewaresStack_[httpMethod].pop()
	}

	/**
	 * Recursively processes all directories in ${listing}
	 *
	 * @param {Listing} listing
	 */
	recurseSubDirectories_(listing) {
		listing.subDirectories.forEach((subDirectory) => {
			let nextDirectory = path.resolve(listing.directory, subDirectory),
				subDirIsMiddlewareDirectory = subDirectory[0] === kMiddlewareDirectoryPrefix,
				subDirIsParam = subDirectory[0] === kParamDirectoryPrefix,
				routeChunk = null

			// 1. Add directory name (or parameter name) to the route stack if ${subDirectory} is
			//    not a middleware directory
			if (!subDirIsMiddlewareDirectory) {
				routeChunk = subDirIsParam ? ':' + subDirectory.substr(1) : subDirectory
				this.routeStack_.push(routeChunk)
			}

			// 2. Recurse through the next subdirectory
			this.routifyRecurse_(nextDirectory, subDirIsMiddlewareDirectory)

			// 3. Pop off any route chunk
			if (routeChunk)
				this.routeStack_.pop()
		})
	}

	/**
	 * ${listing.directory} is a "normal" directory of handlers. That is, it is not strictly contain
	 * middleware; however, it may contain http method specific middleware (wildcard files prefixed
	 * with the caret symbol, see introduction).
	 *
	 * @param {Listing} listing
	 * @param {Array.<Object>} sortedRouteInfos
	 */
	handleRouteDirectory_(listing, sortedRouteInfos) {
		// 1. Split into:
		//    a) middleware routes (prefixed with caret)
		//    b) normal callback handlers
		let mwRouteInfos = [],
			normalRouteInfos = []

		sortedRouteInfos.forEach((routeInfo) => {
			if (routeInfo.hasMiddlewarePrefix)
				mwRouteInfos.push(routeInfo)
			else
				normalRouteInfos.push(routeInfo)
		})

		// 2. Push / pop middleware stack and generate routes
		this.pushMwRouteInfosOnStack_(mwRouteInfos)
		this.generateRoutes_(normalRouteInfos)
		this.recurseSubDirectories_(listing)
		this.popMwRouteInfosOffStack_(mwRouteInfos)
	}

	/**
	 * Generates the express routes based on the current context.
	 *
	 * @param {Array.<Object>} sortedRouteInfos
	 */
	generateRoutes_(sortedRouteInfos) {
		sortedRouteInfos.forEach((routeInfo) => {
			assert(!routeInfo.hasMiddlewarePrefix)

			let routeString = this.routeString_(routeInfo.isStar),
				routeMiddlewares = this.routeMiddlewares_(routeInfo.httpMethod),
				handlerModule = null,
				handlers = null

			try {
				// eslint-disable-next-line global-require
				handlerModule = require(routeInfo.path)
				if (typeof handlerModule !== 'function')
					throw new Error('Module did not export a function')
				handlers = toArray(handlerModule(this.app_, this.middlewares_, routeMiddlewares))
			}
			catch (error) {
				this.log_({path: routeInfo.path}, `Error while loading route: ${routeInfo.httpMethod} ${routeString}: ${error.message}`)
				throw error
			}

			// Finally, generate the route!
			this.router_[routeInfo.httpMethod](routeString, ...routeMiddlewares, ...handlers)

			this.log_({
				httpMethod: routeInfo.httpMethod,
				endpoint: routeString,
				middlewares: this.middlewareNames_([...routeMiddlewares, ...handlers])
			}, `Created route: ${routeInfo.httpMethod.toUpperCase()} ${routeString}`)
		})
	}

	/**
	 * @param {Boolean} isStar indicates if this route should have a wildcard suffix
	 * @returns {String} the joined string of all route chunks
	 */
	routeString_(isStar) {
		let result = '/' + this.routeStack_.join('/')
		if (isStar)
			result += '*'
		return result
	}

	/**
	 * For the given ${httpMethod}, generate a flat array of all middlewares currently on the stack,
	 * taking care to properly handle the special "all" case (which is called for all http methods).
	 *
	 * @param {String} httpMethod
	 * @returns {Array.<Function>}
	 */
	routeMiddlewares_(httpMethod) {
		let result = []

		// Special case: all gets applied to all routes - if it has been defined
		if (this.middlewaresStack_.all)
			this.copyFromMiddlewareStackTo_(result, this.middlewaresStack_.all)

		// Now apply any http method specific middlewares
		if (httpMethod !== 'all' && this.middlewaresStack_[httpMethod])
			this.copyFromMiddlewareStackTo_(result, this.middlewaresStack_[httpMethod])

		return result
	}

	/**
	 * Copies all callback functions in ${middlewareSubStack} into the single, flat ${target} array.
	 *
	 * @param {Array} target
	 * @param {Array.<Array.<Function>>} middlewareSubStack
	 */
	copyFromMiddlewareStackTo_(target, middlewareSubStack) {
		middlewareSubStack.forEach((mwArray) => {
			mwArray.forEach((mw) => {
				target.push(mw)
			})
		})
	}

	/**
	 * Produces an array of middleware names corresponding to the actual middleware function names.
	 * If there are multiple anonymous middleware names in a row, then these are compressed into a
	 * single entity with the number of anonymous functions in parentheses.
	 *
	 * @param {Array.<Function>} middlewares
	 * @returns {Array.<String>}
	 */
	middlewareNames_(middlewares) {
		let names = [],
			nAnonymous = 0
		// Loop through all middlewares except the very last one as this one is the final route
		// handler
		for (let i = 0, z = middlewares.length - 1; i < z; i++) {
			let mwFnName = middlewares[i].name

			if (mwFnName) {
				nAnonymous = 0
				names.push(mwFnName)
				continue
			}

			nAnonymous++
			let lastName = names[names.length - 1]

			if (lastName && lastName.startsWith('anonymous'))
				names[names.length - 1] = `anonymous (x${nAnonymous})`
			else
				names.push('anonymous')
		}
		return names
	}

	/**
	 * Call the info method on any configured bunyan logger (if defined).
	 *
	 * @param {...any} params
	 */
	log_(...params) {
		if (this.logger_)
			this.logger_.info(...params)
	}
}

/**
 * @param {Function|Array.<Function>} functionOrArray
 * @returns {Array.<Function>}
 */
function toArray(functionOrArray) {
	if (typeof functionOrArray === 'function')
		return [functionOrArray]
	else if (Array.isArray(functionOrArray))
		return functionOrArray

	throw new Error('Expected a single or array of express-compatible callback functions')
}
