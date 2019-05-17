import * as _ from 'underscore';
import * as md5 from 'md5';
import * as req from 'request';
import * as chunk from 'chunk';

export class GW2API {
  protected baseUrl = "https://api.guildwars2.com/v2/";
  protected storage: any;
  protected useAuthHeader: boolean = false;
  protected lang: string = 'en';
  protected cache: boolean = true;
  protected storeInCache: boolean = true;
  
  /**
   * Set the storage solution.
   *
   * The solution should have a getItem and setItem method, but can be anything.
   *
   * @param {object} storage
   *  Storage solution. Defaults to localStorage if available. Null if not.
   */
  public setStorage(storage: any) {
    this.storage = storage;
    
    return this;
  }
  
   /**
   * Gets the storage solution.
   *
   * @return {object}
   *   Storage solution.
   */
  public getStorage(): any {
    return this.storage;
  }
  
  /**
   * Setter for the useAuthHeader property.
   *
   * Typically you'll set this to false if you're in a browser
   * because the API doesn't support OPTIONS.
   *
   * @param {boolean} useAuthHeader
   * @returns {GW2API}
   */
  public setUseAuthHeader(useAuth: boolean) {
    this.useAuthHeader = useAuth;
    
    return this;
  }
  
  /**
   * Getter for useAuthHeader.
   *
   * @returns {boolean}
   */
  public getUseAuthHeader() {
    return this.useAuthHeader;
  }
  
   /**
   * Sets the language code. Should be the ISO code (en_US for example).
   *
   * @param {string} langCode
   *   Target language code.
   *
   * @return this
   */
  public setLang (langCode: string) {
    this.lang = langCode;
    return this;
  };

  /**
   * Gets the current language, which some api endpoints use.
   *
   * @return {string}
   *  langcode
   */
  public getLang() {
    return this.lang;
  };

  /**
   * Gets the boolean cache setting.
   *
   * @return {boolean}
   */
  public getCache() {
    return this.cache;
  }
  
  /**
   * Turns caching on or off.
   *
   * @param {boolean} cache
   *   Enable or disable cache.
   */
  setCache (cache: boolean) {
    this.cache = this.storeInCache = cache;
    return this;
  };

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
  public setStoreInCache (storeInCache: boolean) {
    this.storeInCache = storeInCache;
    return this;
  };

  /**
   * Stores the API key in storage.
   *
   * @param {string} key
   *   API Key to use for requests.
   * @return this
   */
  public async setAPIKey(key: string) {
    await this.storage.setItem('apiKey', key);
    return this;
  };

  /**
   * Loads the API key from the local storage.
   *
   * @return string
   */
  public async getAPIKey () {
    return this.storage.getItem('apiKey');
  };
  
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
  public getDeeperInfo (endpointFunc: any, items: [any], chunkSize: number = 100) {
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
            items[i] = { id: items[i] };
          }

          if (items[i].id === res.id) {
            Object.assign(items[i], res);
          }
        }
      });

      return items;
    });
  };

  /**
   * Helper function to do the common endpoint/{id} or ?ids={}
   *
   * @param string endpoint
   * @param mixed ids
   * @param boolean requiresAuth
   *
   * @return Promise
   */
  public getOneOrMany(endpoint, ids, requiresAuth = true, otherParams?: any) {
    var params = {};

    if (typeof ids === 'number' || typeof ids === 'string') {
      endpoint += '/' + ids;
    } else if (Array.isArray(ids)) {
      params['ids'] = ids.sort().join(',');
    }

    if (typeof otherParams === 'object') {
      Object.assign(params, otherParams);
    }

    return this.callAPI(endpoint, params, requiresAuth);
  };

  
  /**
   * Makes a call to the GW2 API.
   *
   * @param endpoint
   * @param params
   * @param requiresAuth
   *
   * @return Promise
   */
  public async callAPI(endpoint: string, params?: any, requiresAuth: any = true): Promise<any> {
    if (typeof requiresAuth == "undefined") {
      requiresAuth = true;
    }

    if (!params) {
      params = {};
    }

    const options = {
      url: this.baseUrl + endpoint
    };

    if (requiresAuth) {
      if (this.useAuthHeader) {
        options['headers'] = {
          'Authorization': 'Bearer ' + await this.getAPIKey(),
        }
      } else {
        params['access_token'] = await this.getAPIKey();
      }
    }

    options['qs'] = params;

    const keys = _.keys(params).sort();
    const tmpArr = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      tmpArr.push(keys[i] + "=" + params[keys[i]]);
    }

    let keystr = '';
    if (tmpArr.length > 0) {
      keystr = '?' + tmpArr.join('&');
    }

    const cacheKey = md5(endpoint + keystr);
    let cachedItem;

    if (this.cache && (cachedItem = await this.storage.getItem(cacheKey))) {
      cachedItem = JSON.parse(cachedItem);
      return cachedItem;
    }

    return new Promise((fulfill, reject) => {
      req.get(options).on('response', (response) => {
        var dataStream = '';

        if (response.statusCode != 200 && response.statusCode != 206) {
          // Error out if the response code isn't 200/206.
          reject("The API Returned an error");
          return;
        }

        response.on('data', (data) => {
          dataStream += data;
        }).on('end', async () => {
          var data = JSON.parse(dataStream);
            
          if (this.storeInCache) {
            await this.storage.setItem(cacheKey, dataStream);
          }

          fulfill(data);
        });

      })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // MARK: External API Functions
   /**
   * Gets account information.
   * 
   * @returns {Promise}
   */
  public getAccount(): Promise<any> {
    const endpoint: string = '/account';

    return this.callAPI(endpoint);
  };

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
  public async getCharacters(characterName: string) {
    let endpoint: string = '/characters';

    if (typeof characterName !== 'undefined') {
      endpoint += '/' + encodeURIComponent(characterName);
    }
    return this.callAPI(endpoint);
  };

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
  public async getAccountAchievements(autoTranslateAchievements: boolean) {
    var p = this.callAPI('/account/achievements');
    
    if (!autoTranslateAchievements) {
      return p;
    }

    return p.then((accountAchievements) => {
      return this.getDeeperInfo(this.getAchievements, accountAchievements, 100);
    });
  };
  
  /**
   * Gets achievements. If no ids are passed, this will return an array of all
   * possible achievement ids.
   * @param  {int|array} achievementIds
   *   <optional> Either an int achievementId or an array of achievementIds
   * @return Promise
   */
  public async getAchievements(achievementIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/achievements', achievementIds, false, { "lang": this.getLang() });
  };
  
  /**
   * Gets a list of items. If no ids are passed, you'll get an array of all ids back.
   *
   * @param  {int|array} itemIds
   *   <optional> Either an int itemId or an array of itemIds.
   *
   * @return Promise
   */
  public async getItems(itemIds): Promise<any> {
    return this.getOneOrMany('/items', itemIds, false);
  };

  
  /**
   * Gets items from the account bank.
   *
   * @param  {Boolean} autoTranslateItems
   *   Whether or not to automatically call the item endpoint.
   * @return {Promise}
   */
  public async getAccountBank(autoTranslateItems: boolean): Promise<any> {
    var p = this.callAPI('/account/bank');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then((bank) => {
      return this.getDeeperInfo(this.getItems, bank, 100);
    });
  };
  
   /**
   * Gets unlocked account dyes.
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  public async getAccountDyes(autoTranslateItems: boolean): Promise<any> {
    var p = this.callAPI('/account/dyes');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then((dyes) => {
      return this.getDeeperInfo(this.getColors, dyes, 100);
    });
  };

  /**
   * Gets the account's material storage.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the materials api.
   * @return {Promise}
   */
  public async getAccountMaterials(autoTranslateItems: boolean) {
    const p = this.callAPI('/account/materials');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then((materials) => {
      return this.getDeeperInfo(this.getItems, materials, 100);
    });
  };

  /**
   * Gets the account's masteries.
   * 
   * @param {Boolean} autoTranslateMasteries
   * 
   * @returns {Promise}
   */
  public async getAccountMasteries(autoTranslateMasteries): Promise<any> {
    const p = this.callAPI('/account/masteries');

    if (!autoTranslateMasteries) {
      return p;
    }

    return p.then((masteries) => {
      return this.getDeeperInfo(this.getMasteries, masteries, 100);
    });
  };
  
  /**
   * Gets the account's finishers.
   * 
   * @param {Boolean} autoTranslate
   * 
   * @returns {Promise}
   */
  public async getAccountFinishers(autoTranslate: boolean) {
    var p = this.callAPI('/account/finishers');

    if (!autoTranslate) {
      return p;
    }

    return p.then((finishers) => {
      return this.getDeeperInfo(this.getFinishers, finishers, 100);
    });
  };
  
    /**
   * Gets the account's unlocked minis.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  public async getAccountMinis(autoTranslateItems): Promise<any> {
    const p = this.callAPI('/account/minis');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then((minis) => {
      return this.getDeeperInfo(this.getMinis, minis, 100);
    });
  };
  
  /**
   * Gets the account's item skins.
   *
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  public async getAccountSkins(autoTranslateItems: boolean): Promise<any> {
    var p = this.callAPI('/account/skins');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then((skins) => {
      return this.getDeeperInfo(this.getSkins, skins, 100);
    });
  };

  /**
   * Gets an account's world boss progression for this reset period.
   * 
   * @param  {Boolean} autoTranslateItems
   *   <optional> If passed as true, will automatically get item descriptions
   *   from the items api.
   * @return {Promise}
   */
  public async getAccountWorldBosses(autoTranslateItems: boolean = true): Promise<any> {
    const p = this.callAPI('/account/worldbosses');

    if (!autoTranslateItems) {
      return p;
    }

    return p.then(bosses => {
      return this.getDeeperInfo(this.getWorldBosses, bosses, 100);
    });
  }

  /**
   * Gets world bosses.
   */
  public async getWorldBosses(ids?: number[]|number): Promise<any> {
    return this.getOneOrMany('worldbosses', ids, false);
  }
  
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
  public async getCommerceTransactions(current: boolean, secondLevel: string): Promise<boolean> {
    var endpoint = "/commerce/transactions/" + (current ? 'current' : 'history') + '/' + secondLevel;
    return this.callAPI(endpoint);
  };
  
  /**
   * Gets commerce listings. If no item ids are passed, it will return
   * a list of all possible ids.
   *
   * @param  {Int|Array} itemIds
   *   Either an Int or Array of items
   * @return {Promise}
   */
  public async getCommerceListings(itemIds: number[]|number): Promise<any> {
    return this.getOneOrMany('/commerce/listings', itemIds, false);
  };
  
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
  public async getCommerceExchange(gemOrCoin: 'gems'|'coin', quantity: number): Promise<any> {
    const second = gemOrCoin === 'gems' ? 'gems' : 'coins';
    return this.callAPI('/commerce/exchange/' + second, { 'quantity': quantity }, false);
  };
  
  /**
   * Gets overall account pvp statistics.
   *
   * @return {Promise}
   */
  public async getPVPStats(): Promise<any> {
    return this.callAPI('/pvp/stats');
  };
  
  /**
   * Gets PVP Game details. If ids are not passed a list of all game ids
   * are returned.
   *
   * @param  {String|Array} gameIds
   *   <optional> Either a gameId or an array of games you'd like more details
   *   on. Note that GameId is a uuid.
   * @return {Promise}
   */
  public async getPVPGames(gameIds?: string[]|string): Promise<any> {
    return this.getOneOrMany('/pvp/games', gameIds);
  };

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
  public async getWVWMatches(worldId: number, matchIds: number[]|number) {
    return this.getOneOrMany('/wvw/matches', matchIds, false, { "world": worldId });
  };

  /**
   * Gets WVW Objectives
   *
   * @param {String|Array} objectiveIds
   *   <optional> Either an objectiveId or array of ids.
   *
   * @return {Promise}
   */
  public async getWVWObjectives(objectiveIds?: string[]|string): Promise<any> {
    return this.getOneOrMany('/wvw/objectives', objectiveIds);
  };

  /**
   * Returns info about a given token. This token must be first set via
   * this.setAPIKey.
   *
   * @return {Promise}
   */
  public async getTokenInfo(): Promise<any> {
    return this.callAPI('/tokeninfo');
  };
  
  /**
   * Gets the wallet information associated with the current API token.
   * @param  {boolean} handleCurrencyTranslation
   *   <optional> If true, will automatically get the currency information.
   *   Otherwise you'll just get currency id and value.
   * @return Promise
   */
  public async getWallet(handleCurrencyTranslation: boolean): Promise<any> {
    if (!handleCurrencyTranslation) {
      return this.callAPI('/account/wallet');
    }

    return this.callAPI('/account/wallet').then((res) => {
      var walletCurrencies = res;
      var lookupIds: number[] = [];
      for (var i = 0, len = res.length; i < len; i++) {
        lookupIds.push(res[i].id as number);
      }

      return this.getCurrencies(lookupIds).then((res) => {
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
  };
  
  /**
   * Loads Masteries
   * 
   * @param {Array<number>} masteryIds
   * 
   * @returns {Promise}
   */
  public async getMasteries(masteryIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/masteries', masteryIds, false);
  };

  /**
  * Loads Finishers
  * 
  * @param {Array<number>} finisherIds
  * 
  * @returns {Promise}
  */
  public async getFinishers(finisherIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/finishers', finisherIds, false);
  };

  /**
   * Gets Dye Colors. If no ids are passed, all possible ids are returned.
   *
   * @param  {int|Array} colorIds
   *   <optional> An int or array of color ids.
   * @return {Promise}
   */
  public async getColors(colorIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/colors', colorIds, false);
  };

  /**
   * Returns the continents list
   * @return Promise
   */
  public async getContinents(): Promise<any> {
    return this.callAPI('/continents');
  };

  /**
   * Returns commonly requested files.
   *
   * @param {String|Array} fileIds
   *  Either a string file id or an array of ids.
   *
   * @return {Promise}
   */
  public async getFiles(fileIds?: string[]|string): Promise<any> {
    return this.getOneOrMany('/files', fileIds, false);
  };
  
  /**
   * Returns the current build id.
   *
   * @return {Promise}
   */
  public async getBuildId(): Promise<any> {
    return this.callAPI('/build');
  };

  /**
   * Returns a list of Quaggans!
   *
   * @param {String|Array} quagganIds
   *   <optional> a String quaggan id or an array of quaggan ids.
   *
   * @return {Promise}
   */
  public async getQuaggans(quagganIds?: string[]|string): Promise<any> {
    return this.getOneOrMany('/quaggans', quagganIds, false);
  };

  /**
   * Gets materials. If no ids are passed, this will return an array of all
   * possible material ids.
   * @param  {int|array} materialIds
   *   <optional> Either an int materialId or an array of materialIds
   * @return Promise
   */
  public async getMaterials(materialIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/materials', materialIds, false);
  };

  /**
   * Gets minis. If no ids are passed, this will return an array of all
   * possible mini ids.
   * @param  {Int|Array}  miniIds
   *   <optional> Either an int or an array of mini ids.
   * @return {Promise}
   */
  public async getMinis(miniIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/minis', miniIds, false);
  };
  
  /**
   * Gets recipes. If no ids are passed, this will return an array of all
   * possible recipe ids.
   * @param  {int|array} recipeIds
   *   <optional> Either an int recipeId or an array of recipeIds
   * @return Promise
   */
  public async getRecipes(recipeIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/recipes', recipeIds, false);
  };

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
  public async searchRecipes(inputItem: number, outputItem?: number): Promise<any> {
    if (inputItem && outputItem) {
      return new Promise((_fulfill, reject) => {
        reject('inputItem and outputItem are mutually exclusive options');
      });
    }

    var options = _.omit({ 'input': inputItem, 'output': outputItem }, (v, _k)=> {
      if (!v) {
        return true;
      }
    });

    return this.callAPI('/recipes/search', options, false);
  };

  /**
   * Gets Skins. If no ids are passed, this returns an array of all skins.
   *
   * @param  {Int|Array} skinIds
   *   <optional> Either an int skinId or an array of skin ids
   * @return {Promise}
   */
  public async getSkins(skinIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/skins', skinIds, false);
  };

  /**
   * Gets currencies. If no ids are passed, this will return an array of all
   * possible material ids.
   * @param  {int|array} currencyIds
   *   <optional> Either an int currencyId or an array of currenciyIds
   * @return Promise
   */
  public async getCurrencies(currencyIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/currencies', currencyIds, false);
  };
  
  /**
   * Gets achievement groups. Examples being "Heart of Thorns, Central Tyria"
   *
   * @param {String|Array} groupIds
   *  <optional> Either a groupId or array of group ids. Note that for this, ids
   *  are guids.
   *
   * @return {Promise}
   */
  public async getAchievementGroups(groupIds?: string[]|string): Promise<any> {
    return this.getOneOrMany('achievements/groups', groupIds, false);
  };

  /**
   * Gets achievement categories. Examples being "Slayer, Hero of Tyria"
   *
   * @param {Int|Array} categoryIds
   *  <optional> Either an int or an array of category ids.
   *
   * @return {Promise}
   */
  public async getAchievementCategories(categoryIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('achievements/categories', categoryIds, false);
  };
  
  /**
   * Gets the daily achievements.
   * 
   * @param {boolean} autoTranslate
   * 
   * @returns {Promise<any>}
   */
  public async getDailyAchievements(autoTranslate = true): Promise<any> {
    var p = this.callAPI('/achievements/daily', { "lang": this.getLang() }, false);
    var that = this;

    if (!autoTranslate) {
      return p;
    }

    function getDeeperItemInfo(key, items) {
      return that.getDeeperInfo(that.getAchievements, items, 100).then(function (res) {
        var ob = {};
        ob[key] = res;
        return ob;
      });
    }

    return p.then((achievements) => {
      var promises = [];

      for (var i in achievements) {
        if (!achievements.hasOwnProperty) {
          continue;
        }

        promises.push(function (_key) { return getDeeperItemInfo(i, achievements[i]) }(i));
      }

      return Promise.all(promises).then((promises) => {
        return promises.reduce((acc, item) => {
          return Object.assign(acc, item);
        }, {});
      });
    });
  };
  
  /**
   * Gets skills. If no ids are passed, this will return an array of all possible
   * skills.
   *
   * @param  {int|array} skillIds
   *   <optional> Either an int skillId or an array of skillIds.
   * @return {Promise}
   */
  public async getSkills(skillIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/skills', skillIds, false);
  };

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
  public async getProfessionSkills(profession: string, skillType: string, includeBundles: boolean): Promise<any> {
    var that = this;

    if (typeof includeBundles == 'undefined') {
      includeBundles = false;
    }

    return this.getSkills().then((skillIds) => {
      // Break skills into chunks.
      var chunks = chunk(skillIds, 50);
      var promises = [];

      chunks.forEach((c) => {
        promises.push(that.getSkills(c).then((skills) => {
          return skills.filter((skill) => {
            if (!skill.professions) {
              return false;
            }

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

      return Promise.all(promises).then((results) => {
        return [].concat.apply([], results);
      });
    });
  };
  
  /**
   * Gets Specializations. If no ids are passed this will return an array of all
   * ids.
   *
   * @param  {Int|Array} specializationIds
   *   <optional> Either an int specialization id or an array of them.
   * @return {Promise}
   */
  public async getSpecializations(specializationIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/specializations', specializationIds, false);
  };

  /**
   * Gets a list of profession specializations.
   *
   * @param  {String} profession
   *   Profession name. Remember to uppercase the first letter.
   *
   * @return {Promise}
   */
  public async getProfessionSpecializations(profession: string) {
    var that = this;
    return this.getSpecializations().then((specializationIds) => {
      // Doing this for the inherant chunking.
      return this.getDeeperInfo(that.getSpecializations, specializationIds);
    }).then((fullSpecializations) => {
      var specs = [];
      fullSpecializations.forEach((spec) => {
        if (spec.profession !== profession) {
          return;
        }
        specs.push(spec);
      });

      return specs;
    });
  };

  /**
   * Gets a list of traits from the passed ids. If no traitIds are passed
   * all trait ids are returned.
   *
   * @param  {Int|Array} traitIds
   *   <optional> An int or array of trait ids.
   *
   * @return {Promise}
   */
  public async getTraits(traitIds?: number[]|number): Promise<any> {
    return this.getOneOrMany('/traits', traitIds, false);
  };
  
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
  public async getEmblems(foreOrBack: 'foregrounds'|'backgrounds', assetIds?: number[]|number): Promise<any> {
    var subpoint = foreOrBack === 'foregrounds' ? 'foregrounds' : 'backgrounds';
    return this.getOneOrMany('/emblem/' + subpoint, assetIds);
  };

  /**
   * Gets info about guild permissions (unauthenticated).
   *
   * @param  {String|Array} permissionIds
   *
   * @return {Promise}
   */
  public async getGuildPermissions(permissionIds: string[]|string): Promise<any> {
    return this.getOneOrMany('/guild/permissions', permissionIds);
  };

  /**
   * Gets info about guild upgrades (unauthenticated).
   *
   * @param  {Int|Array} upgradeIds
   *   <optional> Either an int or an array of upgrade ids.
   *
   * @return {Promise}
   */
  public async getGuildUpgrades(upgradeIds: number[]|number): Promise<any> {
    return this.getOneOrMany('/guild/upgrades', upgradeIds);
  };
}
