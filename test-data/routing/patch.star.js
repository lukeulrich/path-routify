'use strict'

module.exports = function(app, middlewares, routeMiddlewares) {
	console.log('swine')
	return middlewares.validToken
}
