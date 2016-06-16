'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push('delete /owners')
		res.send(res.locals.stack)
	}
}
