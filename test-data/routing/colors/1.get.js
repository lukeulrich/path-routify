'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push('get /colors(1)')
		res.send(res.locals.stack)
	}
}
