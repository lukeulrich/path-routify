'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push('get /caret-without-star')
		res.send(res.locals.stack)
	}
}
