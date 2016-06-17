'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return function(req, res, next) {
		res.locals.stack.push(`patch /skills/${req.params.type}`)
		res.send(res.locals.stack)
	}
}
