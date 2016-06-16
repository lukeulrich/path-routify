'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push('get /wildcard')
		res.send(res.locals.stack)
	}
}
