'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return [
		middlewares.jsonBody,
		function(req, res, next) {
			res.locals.stack.push('post /skills')
			res.send(res.locals.stack)
		}
	]
}
