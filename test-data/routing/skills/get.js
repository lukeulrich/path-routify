'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	return [
		function(req, res, next) {
			res.locals.stack.push('get /skills(1)')
			next()
		},
		function(req, res, next) {
			res.locals.stack.push('get /skills(2)')
			res.send(res.locals.stack)
		}
	]
}
