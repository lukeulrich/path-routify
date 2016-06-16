'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push(`get /owners/${req.params.id}`)
		res.send(res.locals.stack)
	}
}
