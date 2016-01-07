/**
 * Guild Wars 2 API
 * @module gw2-api
 */

var http = require('http');
var Promise = require('promise');
var request = require('request');
var _ = require('underscore');
var md5 = require('js-md5');

/** @class */
var GW2API = function () {
  this.storage = typeof localStorage === "undefined" ? null : localStorage;
  this.lang = 'en_US';
  this.cache = this.storeInCache = false;
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

  getCache: function () {
    return this.cache;
  },

  setCache: function (cache) {
    this.cache = this.storeInCache = cache;
    return this;
  },

  setStoreInCache: function (storeInCache) {
    this.storeInCache = storeInCache;
    return this;
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

  /**
   * Loads the characters associated with the assigned API token.
   *
   * Requires authenticaion
   *
   * @param {string} characterName
   *  <optional> Get details on a particular character.
   *
   * @return Promise
   */
  getCharacters : function (characterName) {
    var endpoint = '/characters';

    if (typeof characterName !== 'undefined') {
      endpoint += '/' + encodeURIComponent(characterName);
    }
    return this.callAPI(endpoint);
  },

  /**
   * Gets the wallet information associated with the current API token.
   * @param  {boolean} handleCurrencyTranslation
   *   <optional> If true, will automatically get the currency information.
   *   Otherwise you'll just get currency id and value.
   * @return Promise
   */
  getWallet : function (handleCurrencyTranslation) {
    if (!handleCurrencyTranslation) {
      return this.callAPI('/account/wallet');
    }

    var that = this;

    return this.callAPI('/account/wallet').then(function (res) {
      var walletCurrencies = res;
      var lookupIds = [];
      for (var i = 0, len = res.length; i < len; i++) {
        lookupIds.push(res[i].id);
      }

      return that.getCurrencies(lookupIds).then(function (res) {
        for (var i = 0, len = res.length; i < len; i++) {
          for (var x = 0, xlen = walletCurrencies.length; x < xlen; x++) {
            if (res[i].id == walletCurrencies[x].id) {
              Object.assign(walletCurrencies[x], res[i]);
              break;
            }
          }
        }
        return walletCurrencies;
      });
    });
  },

  /**
   * Returns the continents list
   * @return Promise
   */
  getContinents : function () {
    return this.callAPI('/continents');
  },

  /**
   * Gets a list of items. If no ids are passed, you'll get an array of all ids back.
   *
   * @param  {int|array} itemIds
   *   <optional> Either an int itemId or an array of itemIds.
   *
   * @return Promise
   */
  getItems : function (itemIds) {
    return this.getOneOrMany('/items', itemIds, false);
  },

  /**
   * Gets materials. If no ids are passed, this will return an array of all
   * possible material ids.
   * @param  {int|array} materialIds
   *   <optional> Either an int materialId or an array of materialIds
   * @return Promise
   */
  getMaterials : function (materialIds) {
    return this.getOneOrMany('/materials', materialIds, false);
  },

  /**
   * Gets recipes. If no ids are passed, this will return an array of all
   * possible recipe ids.
   * @param  {int|array} recipeIds
   *   <optional> Either an int recipeId or an array of recipeIds
   * @return Promise
   */
  getRecipes : function (recipeIds) {
    return this.getOneOrMany('/recipes', recipeIds, false);
  },

  /**
   * Gets currencies. If no ids are passed, this will return an array of all
   * possible material ids.
   * @param  {int|array} currencyIds
   *   <optional> Either an int currencyId or an array of currenciyIds
   * @return Promise
   */
  getCurrencies : function (currencyIds) {
    return this.getOneOrMany('/currencies', currencyIds, false);
  },

  /**
   * Gets achievements. If no ids are passed, this will return an array of all
   * possible achievement ids.
   * @param  {int|array} achievementIds
   *   <optional> Either an int achievementId or an array of achievementIds
   * @return Promise
   */
  getAchievements : function (achievementIds) {
    return this.getOneOrMany('/achievements', achievementIds, false, {"lang": this.getLang()});
  },

  /**
   * Gets daily achievements. This will return an object with the various achievement
   * categories as keys. The current keys are "wvw", "pvp", and "pve"
   *
   * @return Promise
   */
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
      params['ids'] = ids.sort().join(',');
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

    var keys = _.keys(params).sort();
    var tmpArr = [];
    for (var i = 0, len = keys.length; i < len; i++) {
      tmpArr.push(keys[i] + "=" + params[keys[i]]);
    }

    var keystr = '';
    if (tmpArr.length > 0) {
      keystr = '?' + tmpArr.join('&');
    }

    var cacheKey = md5(endpoint + keystr);
    var cachedItem;

    if (this.cache && (cachedItem = this.storage.getItem(cacheKey))) {
      cachedItem = JSON.parse(cachedItem);
      return new Promise(function (fulfill, reject) { fulfill(cachedItem); });
    }

    var that = this;

    return new Promise(function (fulfill, reject) {
      request.get(options).on('response', function(response) {
        var dataStream = '';
        response.on('data', function (data) {
          dataStream += data;
        }).on('end', function() {
          var data = JSON.parse(dataStream);

          if (that.storeInCache) {
            that.storage.setItem(cacheKey, dataStream);
          }

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
