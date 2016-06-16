'use strict'

// Local
let PathRoutifier = require('./PathRoutifier')

/**
 * Convenience method for generating express-compatible routes using PathRoutifier. Any ${options}
 * are also passed to the PathRoutifier for its configuration.
 *
 * @param {express} app
 * @param {String} routesPath root path to recursively transform into express compatible routes
 * @param {Object?} options defaults to an empty object
 * @param {String?} options.middlewaresPath
 * @param {String?} middlewaresPath path to all application middlewares
 * @returns {express.Router}
 */
module.exports = function(app, routesPath, options = {}) {
	let pathRoutifier = new PathRoutifier(app, options),
		middlewares = pathRoutifier.loadMiddlewares(options.middlwaresPath)
	return pathRoutifier.routify(routesPath, middlewares)
}
