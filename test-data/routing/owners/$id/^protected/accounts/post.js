'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push(`post /owners/${req.params.id}/accounts`)
		res.send(res.locals.stack)
	}
}
