'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push(`all /owners/${req.params.id}/(^protected)`)
		next()
	}
}
