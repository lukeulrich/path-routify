'use strict'

// This file should be ignored because it is in a middleware directory and has a star suffix
module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push('get ^auth/*')
		next()
	}
}
