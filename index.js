/**
 * @module gw2-api
 * @see module:src/gw2-api
 */

var gw2 = require('./src/gw2-api');

/**
 * @class memStore
 * In memory storage system for testing
 */
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
  /**
   * {@link GW2API}
   * @type {GW2API}
   */
  gw2 : gw2,
  /**
   * memStore constructor
   * @type {memStore}
   */
  memStore : memStore
}
