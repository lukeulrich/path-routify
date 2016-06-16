'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push(`put /owners/${req.params.id}/dogs/${req.params.dogId}`)
		res.send(res.locals.stack)
	}
}
