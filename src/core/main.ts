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
    this.storage.setItem('apiKey', key);
    return this;
  };

  /**
   * Loads the API key from the local storage.
   *
   * @return string
   */
  public getAPIKey () {
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
  public getDeeperInfo (endpointFunc: any, items: [any], chunkSize: number) {
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
  public async callAPI(endpoint: string, params?: any, requiresAuth?: any): Promise<any> {
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
          'Authorization': 'Bearer ' + this.getAPIKey()
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

    if (this.cache && (cachedItem = this.storage.getItem(cacheKey))) {
      cachedItem = JSON.parse(cachedItem);
      return new Promise(function (fulfill, _reject) { fulfill(cachedItem); });
    }

    return new Promise((fulfill, reject) => {
      req.get(options).on('response', function (response) {
        var dataStream = '';

        if (response.statusCode != 200) {
          // Error out if the response code isn't 200.
          reject("The API Returned an error");
          return;
        }

        response.on('data', function (data) {
          dataStream += data;
        }).on('end', function () {
          var data = JSON.parse(dataStream);

          if (this.storeInCache) {
            this.storage.setItem(cacheKey, dataStream);
          }

          fulfill(data);
        });

      })
        .on('error', function (error) {
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
  public async getAchievements(achievementIds?: [number]|number): Promise<any> {
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
}
