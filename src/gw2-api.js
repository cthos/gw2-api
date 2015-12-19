var http = require('http');
var Promise = require('promise');
var request = require('request');

var GW2API = function () {
  this.storage = typeof localStorage === "undefined" ? null : localStorage;
  this.lang = 'en_US';
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
  
  setLang : function (langCode) {
    this.lang = langCode;
    return this;
  },
  
  getLang: function () {
    return this.lang;
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
  
  getCharacters : function (characterName) {
    var endpoint = '/characters';
    
    if (typeof characterName !== 'undefined') {
      endpoint += '/' + encodeURIComponent(characterName);
    }
    return this.callAPI(endpoint);
  },
  
  getContinents : function () {
    return this.callAPI('/continents');
  },
  
  getItems : function (itemIds) {
    return this.getOneOrMany('/items', itemIds, false);
  },
  
  getMaterials : function (materialIds) {    
    return this.getOneOrMany('/materials', materialIds, false);
  },
  
  getRecipes : function (recipeIds) {
    return this.getOneOrMany('/recipes', recipeIds, false);
  },
  
  getAchievements : function (achievementIds) {
    return this.getOneOrMany('/achievements', achievementIds, false, {"lang": this.getLang()});
  },
  
  getDailyAchievements : function () {
    return this.callAPI('/achievements/daily', {"lang": this.getLang()}, false);
  },
  
  /**
   * Helper function to do the common endpoint/{id} or ?ids={}
   * 
   * @param string endpoint
   * @param mixed ids
   * @param boolean requiresAuth
   * 
   * @return Promise
   */
  getOneOrMany : function(endpoint, ids, requiresAuth, otherParams) {
    var params = {};
    
    if (typeof ids === 'number') {
      endpoint += '/' + ids;
    } else if (Array.isArray(ids)) {
      params['ids'] = ids.join(',');
    }
    
    if (typeof otherParams === 'object') {
      Object.assign(params, otherParams);
    }
    
    return this.callAPI(endpoint, params, requiresAuth);
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
