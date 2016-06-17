'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	let index = routeMiddlewares.indexOf(middlewares.validToken)
	if (index >= 0)
		routeMiddlewares.splice(index, 1)

	return function(req, res, next) {
		res.locals.stack.push('patch /skills')
		res.send(res.locals.stack)
	}
}
