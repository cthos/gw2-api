var http = require('http');
var Promise = require('promise');
var request = require('request');

var GW2API = function () {
	this.storage = typeof localStorage === "undefined" ? null : localStorage;
}

GW2API.prototype = {
	baseUrl: "https://api.guildwars2.com/v2/",
	
	setStorage : function (storage) {
		this.storage = storage;
		return this;
	},
	
	getStorage: function () {
		return this.storage;
	},
	
	/**
	 * Stores the API key in storage.
	 * 
	 * @return this
	 */
	setAPIKey: function (key) {
		this.storage.setItem('apiKey', key);
		return this;
	},
	
	/**
	 * Loads the API key from the local storage.
	 */
	getAPIKey: function () {
		return this.storage.getItem('apiKey');
	},
	
	getCharacters : function () {
		return this.callAPI('/characters');
	},
	
	getContinents : function () {
		return this.callAPI('/continents');
	},
	
	getItems : function (itemIds) {
		var params = {};
		var url = '/items';
		
		if (typeof itemIds === 'number') {
			url += '/' + itemIds;
		} else if (Array.isArray(itemIds)) {
			params['ids'] = itemIds.join(',');
		}
		
		return this.callAPI(url, params, false);
	},
	
	/**
	 * Makes a call to the GW2 API.
	 * 
	 * @param endpoint
	 * @param params
	 * @param requiresAuth
	 * 
	 * @return Promise
	 */
	callAPI: function (endpoint, params, requiresAuth) {
		if (typeof requiresAuth == "undefined") {
			requiresAuth = true;
		}
		
		if (!params) {
			params = null;
		}
		
		var options = {
			url : this.baseUrl + endpoint,
			qs : params
		}
		
		if (requiresAuth) {
			options['headers'] = {
				'Authorization' : 'Bearer ' + this.getAPIKey()
			}
		}
		
		return new Promise(function (fulfill, reject) {
			request.get(options).on('response', function(response) {
				var dataStream = '';
				response.on('data', function (data) {
					dataStream += data;
				}).on('end', function() {
					var data = JSON.parse(dataStream);
					fulfill(data);
				});
				
			})
			.on('error', function(error) {
				reject(error);	
			});
		});
	}
}

module.exports = GW2API;