var assert = require('assert');
var gw2 = require('../index');

var api = new gw2.gw2();
var mem = new gw2.memStore();

api.setStorage(mem);

describe('GW2API', function () {
  describe('Continents', function () {
    it('Should have 2 contients', function () {
      return api.getContinents().then(function(res) {
        assert.equal(res.length, 2);
      });
    });
  });
  
  describe('Items', function () {
    it ('Should have items', function () {
      return api.getItems().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });
    
    it('Should get a single item', function () {
      return api.getItems(15).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.name, "Abomination Hammer");
      });
    });
    
    it('Should get multiple items', function () {
      return api.getItems([15, 411]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
      });
    });
  });
  
  describe('Materials', function () {
    it ('Should have materials', function () {
      return api.getMaterials().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });
    
    it('Should get a single material', function () {
      return api.getMaterials(5).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.name, "Cooking Materials");
      });
    });
    
    it('Should get multiple materials', function () {
      return api.getMaterials([5, 6]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
        assert.equal(res[0].name, "Cooking Materials");
      });
    });
  });
  
  describe('Recipes', function () {
    it ('Should have recipes', function () {
      return api.getRecipes().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });
    
    it('Should get a single recipe', function () {
      return api.getRecipes(7319).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.output_item_id, 46742);
      });
    });
    
    it('Should get multiple recipes', function () {
      return api.getRecipes([1, 2]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
      });
    });
  });
  
  describe('Daily Achievements', function () {
    
  });
});