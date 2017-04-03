var http = require('http');
var Promise = require('promise');
var request = require('request');
var _ = require('underscore');
var md5 = require('js-md5');
var objAssign = require('object.assign').getPolyfill();
var chunk = require('chunk');

/**
 * GW2 API Main interface
 *
 * @class
 * @author cthos <cthos@alextheward.com>
 */
var GW2API = function () {
  this.storage = typeof localStorage === "undefined" ? null : localStorage;
  this.lang = 'en_US';
  this.cache = this.storeInCache = false;

  this.useAuthHeader = true;
}

GW2API.prototype = {
  /**
   * API Base url. Constant
   * @type {String}
   */
  baseUrl: "https://api.guildwars2.com/v2/",

  /**
   * Set the storage solution.
   *
   * The solution should have a getItem and setItem method, but can be anything.
   *
   * @param {object} storage
   *  Storage solution. Defaults to localStorage if available. Null if not.
   */
  setStorage : function (storage) {
    this.storage = storage;
    return this;
  },

  /**
   * Gets the storage solution.
   *
   * @return {object}
   *   Storage solution.
   */
  getStorage: function () {
    return this.storage;
  },

  /**
   * Setter for the useAuthHeader property.
   *
   * Typically you'll set this to false if you're in a browser
   * because the API doesn't support OPTIONS.
   *
   * @param {boolean} useAuthHeader
   * @returns {GW2API}
     */
  setUseAuthHeader : function (useAuthHeader) {
    this.useAuthHeader = useAuthHeader;

    return this;
  },

  /**
   * Getter for useAuthHeader.
   *
   * @returns {boolean}
     */
  getUseAuthHeader : function () {
    return this.useAuthHeader;
  },

  /**
   * Sets the language code. Should be the ISO code (en_US for example).
   *
   * @param {string} langCode
   *   Target language code.
   *
   * @return this
   */
  setLang : function (langCode) {
    this.lang = langCode;
    return this;
  },

  /**
   * Gets the current language, which some api endpoints use.
   *
   * @return {string}
   *  langcode
   */
  getLang: function () {
    return this.lang;
  },

  /**
   * Gets the boolean cache setting.
   *
   * @return {boolean}
   */
  getCache: function () {
    return this.cache;
  },

  /**
   * Turns caching on or off.
   *
   * @param {boolean} cache
   *   Enable or disable cache.
   */
  setCache: function (cache) {
    this.cache = this.storeInCache = cache;
    return this;
  },

  /**
   * Enables or disables storing API results in cache.
   * This is distinct from setCache, which turns all caching on or off.
   *
   * This setting would be used to update the cache but not actually return
   * the results.
   *
   * @param {boolean} storeInCache
   *   Whether or not to store results in cache.
   */
  setStoreInCache: function (storeInCache) {
    this.storeInCache = storeInCache;
    return this;
  },

  /**
   * Stores the API key in storage.
   *
   * @param {string} key
   *   API Key to use for requests.
   * @return this
   */
  setAPIKey: function (key) {
    this.storage.setItem('apiKey', key);
    return this;
  },

  /**
   * Loads the API key from the local storage.
   *
   * @return string
   */
  getAPIKey: function () {
    return this.storage.getItem('apiKey');
  },

  /**
   * Gets account information.
   * 
   * @returns {Promise}
   */
  getAccount: function () {
    var endpoint = '/account';

    return this.callAPI(endpoint);
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
   * Gets Account achievements.
   *
   * @param {Boolean} autoTranslateAchievements
   *   If this is set to true, it will automatically call the achievement
   *   endpoint to get more details as part of the return.
   *
   * @return {Array}
   *   Account achievements.
   */
  getAccountAchievements : function (autoTranslateAchievements) {
    var p = this.callAPI('/account/achievements');
    var that = this;

    if (!autoTranslateAchievements) {
        return p;
    }

    return p.then(function (accountAchievements) {
      return that.getDeeperInfo(that.getAchievements, accountAchievements, 100);
    });
  },

  /**
   * Gets items from the account bank.
   *
   * @param  {Boolean} autoTranslateItems
   *   Whether or not to automatically call the item endpoint.
   * @return {Promise}
   */
  getAccountBank: function (autoTranslateItems) {
    var p = this.callAPI('/account/bank');
    var that = this;

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(function (bank) {
      return that.getDeeperInfo(that.getItems, bank, 100);
    });
  },

  /**
   * Gets unlocked account dyes.
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  getAccountDyes: function (autoTranslateItems) {
    var p = this.callAPI('/account/dyes');
    var that = this;

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(function (dyes) {
      return that.getDeeperInfo(that.getColors, dyes, 100);
    });
  },

  /**
   * Gets the account's material storage.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the materials api.
   * @return {Promise}
   */
  getAccountMaterials: function (autoTranslateItems) {
    var p = this.callAPI('/account/materials');
    var that = this;

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(function (materials) {
      return that.getDeeperInfo(that.getItems, materials, 100);
    });
  },

  /**
   * Gets the account's unlocked minis.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  getAccountMinis: function (autoTranslateItems) {
    var p = this.callAPI('/account/minis');
    var that = this;

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(function (minis) {
      return that.getDeeperInfo(that.getMinis, minis, 100);
    });
  },

  /**
   * Gets the account's item skins.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  getAccountSkins: function (autoTranslateItems) {
    var p = this.callAPI('/account/skins');
    var that = this;

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(function (skins) {
      return that.getDeeperInfo(that.getSkins, skins, 100);
    });
  },

  /**
   * Gets an account's commerce transactions.
   *
   * @param {Boolean} current
   *   If true, this will query current transactions. Otherwise it
   *   will query historical transactions.
   * @param {String} secondLevel
   *   Either "buys" or "Sells"
   * @return {Promise}
   */
  getCommerceTransactions : function (current, secondLevel) {
    var endpoint = "/commerce/transactions/" + (current ? 'current' : 'history') + '/' + secondLevel;
    return this.callAPI(endpoint);
  },

  /**
   * Gets commerce listings. If no item ids are passed, it will return
   * a list of all possible ids.
   *
   * @param  {Int|Array} itemIds
   *   Either an Int or Array of items
   * @return {Promise}
   */
  getCommerceListings : function (itemIds) {
    return this.getOneOrMany('/commerce/listings', itemIds, false);
  },

  /**
   * Returns the current gem buy and sell prices.
   *
   * Quantity _must_ be higher than needed to buy a single coin or gem.
   *
   * @param {String} gemOrCoin
   *   The string 'gem' for gold cost to buy gems.
   *   'coin' for gem price for coins.
   * @param {Int} quantity
   *   The number of coins or gems to exchange (this is a required parameter).
   * @return {Promise}
   */
  getCommerceExchange : function (gemOrCoin, quantity) {
    var second = gemOrCoin === 'gems' ? 'gems' : 'coins';
    return this.callAPI('/commerce/exchange/' + second, {'quantity': quantity}, false);
  },

  /**
   * Gets overall account pvp statistics.
   *
   * @return {Promise}
   */
  getPVPStats : function () {
    return this.callAPI('/pvp/stats');
  },

  /**
   * Gets PVP Game details. If ids are not passed a list of all game ids
   * are returned.
   *
   * @param  {String|Array} gameIds
   *   <optional> Either a gameId or an array of games you'd like more details
   *   on. Note that GameId is a uuid.
   * @return {Promise}
   */
  getPVPGames : function (gameIds) {
    return this.getOneOrMany('/pvp/games', gameIds);
  },

  /**
   * Gets WVW Matches.
   *
   * @param {Int} worldId
   *   A world who's id is participating in the match.
   * @param  {String|Array} matchIds
   *   String match id, or an array of match ids.
   *
   * @return {Promise}
   */
  getWVWMatches : function (worldId, matchIds) {
    return this.getOneOrMany('/wvw/matches', matchIds, false, {"world": worldId});
  },

  /**
   * Gets WVW Objectives
   *
   * @param {String|Array} objectiveIds
   *   <optional> Either an objectiveId or array of ids.
   *
   * @return {Promise}
   */
  getWVWObjectives : function (objectiveIds) {
    return this.getOneOrMany('/wvw/objectives', objectiveIds);
  },

  /**
   * Returns info about a given token. This token must be first set via
   * this.setAPIKey.
   *
   * @return {Promise}
   */
  getTokenInfo : function () {
    return this.callAPI('/tokeninfo');
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
              objAssign(walletCurrencies[x], res[i]);
              break;
            }
          }
        }
        return walletCurrencies;
      });
    });
  },

  /**
   * Gets Dye Colors. If no ids are passed, all possible ids are returned.
   *
   * @param  {int|Array} colorIds
   *   <optional> An int or array of color ids.
   * @return {Promise}
   */
  getColors : function (colorIds) {
    return this.getOneOrMany('/colors', colorIds, false);
  },

  /**
   * Returns the continents list
   * @return Promise
   */
  getContinents : function () {
    return this.callAPI('/continents');
  },

  /**
   * Returns commonly requested files.
   *
   * @param {String|Array} fileIds
   *  Either a string file id or an array of ids.
   *
   * @return {Promise}
   */
  getFiles : function (fileIds) {
    return this.getOneOrMany('/files', fileIds, false);
  },

  /**
   * Returns the current build id.
   *
   * @return {Promise}
   */
  getBuildId : function () {
    return this.callAPI('/build');
  },

  /**
   * Returns a list of Quaggans!
   *
   * @param {String|Array} quagganIds
   *   <optional> a String quaggan id or an array of quaggan ids.
   *
   * @return {Promise}
   */
  getQuaggans : function (quagganIds) {
    return this.getOneOrMany('/quaggans', quagganIds, false);
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
   * Gets minis. If no ids are passed, this will return an array of all
   * possible mini ids.
   * @param  {Int|Array}  miniIds
   *   <optional> Either an int or an array of mini ids.
   * @return {Promise}
   */
  getMinis : function (miniIds) {
    return this.getOneOrMany('/minis', miniIds, false);
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
   * Searches for recipes which match an item id. inputItem and outputItem
   * are mutually exclusive.
   *
   * @param  {Int} inputItem
   *   Search for recipes containing this item.
   * @param  {Int} outputItem
   *   Search for recipes which will produce this item.
   * @return {Promise}
   */
  searchRecipes : function (inputItem, outputItem) {
    if (inputItem && outputItem) {
      return new Promise(function (fulfill, reject) {
        reject('inputItem and outputItem are mutually exclusive options');
      });
    }

    var options = _.omit({'input' : inputItem, 'output' : outputItem}, function (v, k) {
      if (!v) {
        return true;
      }
    });

    return this.callAPI('/recipes/search', options, false);
  },

  /**
   * Gets Skins. If no ids are passed, this returns an array of all skins.
   *
   * @param  {Int|Array} skinIds
   *   <optional> Either an int skinId or an array of skin ids
   * @return {Promise}
   */
  getSkins : function (skinIds) {
    return this.getOneOrMany('/skins', skinIds, false);
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
   * Gets achievement groups. Examples being "Heart of Thorns, Central Tyria"
   *
   * @param {String|Array} groupIds
   *  <optional> Either a groupId or array of group ids. Note that for this, ids
   *  are guids.
   *
   * @return {Promise}
   */
  getAchievementGroups : function (groupIds) {
    return this.getOneOrMany('achievements/groups', groupIds, false);
  },

  /**
   * Gets achievement categories. Examples being "Slayer, Hero of Tyria"
   *
   * @param {Int|Array} categoryIds
   *  <optional> Either an int or an array of category ids.
   *
   * @return {Promise}
   */
  getAchievementCategories : function (categoryIds) {
    return this.getOneOrMany('achievements/categories', categoryIds, false);
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
   * Gets skills. If no ids are passed, this will return an array of all possible
   * skills.
   *
   * @param  {int|array} skillIds
   *   <optional> Either an int skillId or an array of skillIds.
   * @return {Promise}
   */
  getSkills : function (skillIds) {
    return this.getOneOrMany('/skills', skillIds, false);
  },

  /**
   * [Helper Method] Gets skills for a particular profession.
   *
   * @param  {String} profession
   *   The string key to match profession on.
   * @param {String} skillType
   *   <optional> The type of skills to return ("Weapon", "Heal", etc.)
   * @param {Boolean} includeBundles
   *   <optional> Whether or not to include bundles as part of the return list.
   *   This option is meaningless if skillType == 'Bundle'
   * @return {Promise}
   */
  getProfessionSkills: function (profession, skillType, includeBundles) {
    var that = this;

    if (typeof includeBundles == 'undefined') {
      includeBundles = false;
    }

    return this.getSkills().then(function (skillIds) {
      // Break skills into chunks.
      var chunks = chunk(skillIds, 50);
      var promises = [];

      chunks.forEach(function (c) {
        promises.push(that.getSkills(c).then(function (skills) {
          var profSkills = [];
          return skills.filter(function (skill) {
            if (skill.professions.indexOf(profession) == -1) {
              return false;
            }

            if (!includeBundles && skill.type == 'Bundle') {
              return false;
            }

            if (skillType && skill.type == skillType) {
              return true;
            } else if (skillType) {
              return false;
            }

            return true;
          });
        }));
      });

      return Promise.all(promises).then(function (results) {
        return [].concat.apply([], results);
      });
    });
  },

  /**
   * Gets Specializations. If no ids are passed this will return an array of all
   * ids.
   *
   * @param  {Int|Array} specializationIds
   *   <optional> Either an int specialization id or an array of them.
   * @return {Promise}
   */
  getSpecializations : function (specializationIds) {
    return this.getOneOrMany('/specializations', specializationIds, false);
  },

  /**
   * Gets a list of profession specializations.
   *
   * @param  {String} profession
   *   Profession name. Remember to uppercase the first letter.
   *
   * @return {Promise}
   */
  getProfessionSpecializations : function (profession) {
    var that = this;
    return this.getSpecializations().then(function (specializationIds) {
      // Doing this for the inherant chunking.
      return that.getDeeperInfo(that.getSpecializations, specializationIds);
    }).then(function (fullSpecializations) {
      var specs = [];
      fullSpecializations.forEach(function (spec) {
        if (spec.profession !== profession) {
          return;
        }
        specs.push(spec);
      });

      return specs;
    });
  },

  /**
   * Gets a list of traits from the passed ids. If no traitIds are passed
   * all trait ids are returned.
   *
   * @param  {Int|Array} traitIds
   *   <optional> An int or array of trait ids.
   *
   * @return {Promise}
   */
  getTraits : function (traitIds) {
    return this.getOneOrMany('/traits', traitIds, false);
  },

  /**
   * Returns the assets required to render emblems.
   *
   * @param  {String} foreOrBack
   *   Either the string "foregrounds" or "backgrounds"
   * @param  {Int|Array} assetIds
   *   <optional> Either an Int or Array assetId
   *
   * @return {Promise}
   */
  getEmblems : function (foreOrBack, assetIds) {
    var subpoint = foreOrBack === 'foregrounds' ? 'foregrounds' : 'backgrounds';
    return this.getOneOrMany('/emblem/' + subpoint, assetIds);
  },

  /**
   * Gets info about guild permissions (unauthenticated).
   *
   * @param  {String|Array} permissionIds
   *
   * @return {Promise}
   */
  getGuildPermissions : function (permissionIds) {
    return this.getOneOrMany('/guild/permissions', permissionIds);
  },

  /**
   * Gets info about guild upgrades (unauthenticated).
   *
   * @param  {Int|Array} upgradeIds
   *   <optional> Either an int or an array of upgrade ids.
   *
   * @return {Promise}
   */
  getGuildUpgrades : function (upgradeIds) {
    return this.getOneOrMany('/guild/upgrades', upgradeIds);
  },

  /**
   * Helper method to convert a list of ids (or objects with an id parameter)
   * into more useful information via the passed endpointFunc.
   *
   * It chunks the array into chunkSize pieces and makes that many api calls
   * in parallel.
   *
   * Usually used for the account calls that don't return full details on equipment,
   * for example.
   *
   * @param  {function} endpointFunc
   *   The function to call to get more details. Must be in the GW2API object
   *   and must return a promise.
   * @param  {Array} Items
   *   An array of items to transform. Either an array of ints or objects.
   * @param  {Int} chunkSize
   *   How large each batch call should be. Defaults to 100.
   *
   * @return {Promise}
   */
  getDeeperInfo: function (endpointFunc, items, chunkSize) {
    var lookupIds = [];
    var promises = [];
    var that = this;

    if (!chunkSize) {
      chunkSize = 100;
    }

    items.forEach(function (item) {
      if (!item) {
        // Some endpoints return null, for empty bank slots, for example.
        return;
      }
      if (typeof item == 'number') {
        lookupIds.push(item);
        return;
      }
      lookupIds.push(item.id);
    });

    var chunks = chunk(lookupIds, chunkSize);
    chunks.forEach(function (ch) {
      promises.push(endpointFunc.call(that, ch));
    });

    return Promise.all(promises).then(function (results) {
      var reses = [].concat.apply([], results);

      reses.forEach(function (res) {
        for (var i = 0, len = items.length; i < len; i++) {
          if (!items[i]) {
            continue;
          }

          if (typeof items[i] == 'number') {
            items[i] = {id: items[i]};
          }

          if (items[i].id === res.id) {
            objAssign(items[i], res);
          }
        }
      });

      return items;
    });
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

    if (typeof ids === 'number' || typeof ids === 'string') {
      endpoint += '/' + ids;
    } else if (Array.isArray(ids)) {
      params['ids'] = ids.sort().join(',');
    }

    if (typeof otherParams === 'object') {
      objAssign(params, otherParams);
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
      params = {};
    }

    var options = {
      url : this.baseUrl + endpoint
    };

    if (requiresAuth) {
      if (this.useAuthHeader) {
        options['headers'] = {
          'Authorization' : 'Bearer ' + this.getAPIKey()
        }
      } else {
        params['access_token'] = this.getAPIKey();
      }
    }

    options['qs'] = params;

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
