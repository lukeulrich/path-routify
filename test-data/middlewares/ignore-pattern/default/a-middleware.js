'use strict'

module.exports = function(app) {
	return function aMiddleware(req, res, next) {
		next()
	}
}
