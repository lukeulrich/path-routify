'use strict'

module.exports = function(app) {
	return function toIgnore(req, res, next) {
		next()
	}
}
