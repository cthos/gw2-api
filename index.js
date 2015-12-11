var gw2 = require('./src/gw2-api');
var memStore = function () {};

memStore.prototype = {
	cache: {},
	setItem : function (key, val) {
		this.cache[key] = val;
		return this;
	},
	
	getItem: function (key) {
		return this.cache[key];
	}
}

module.exports = {
	gw2 : gw2,
	memStore : memStore
}