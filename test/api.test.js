var assert = require('assert');
var gw2 = require('../index');
var md5 = require('js-md5');

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

  describe('Cache', function () {
    before(function () {
      api.setCache(true);
    });

    after(function () {
      api.setCache(false);
    });

    it ('Should store continents in cache', function () {
      return api.getContinents().then(function(res) {
        var continents = api.getStorage().getItem(md5('/continents'));
        continents = JSON.parse(continents);
        assert.equal(continents.length, 2);
        assert.deepEqual(res, continents);
      }).then(function (res) {

      });
    });

    it ('Should return different results on single item calls', function () {
      var itemResult1;

      return api.getItems(15).then(function (res) {
        itemResult1 = res;
        return api.getItems(411);
      }).then(function (res) {
        assert.notEqual(itemResult1.name, res.name);
      });
    });

     it ('Should return different results on multiple item calls', function () {
      var itemResult1;

      return api.getItems([15, 411]).then(function (res) {
        itemResult1 = res;
        return api.getItems([15, 211]);
      }).then(function (res) {
        assert.notDeepEqual(itemResult1, res);
      });
    });

    it ('Should return the same result on different id orders', function () {
      var itemResult1;

      return api.getItems([15, 411]).then(function (res) {
        itemResult1 = res;
        return api.getItems([411, 15]);
      }).then(function (res) {
        assert.deepEqual(itemResult1, res);
      });
    });
  });

  describe('Characters', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it('Should get characters', function () {
      return api.getCharacters().then(function (res) {
        assert.equal(res.indexOf('Daginus') > -1, true);
      });
    });

    it('Should get a single Character', function () {
      return api.getCharacters('Daginus').then(function (ch) {
        assert.equal(ch.profession, 'Necromancer');
        assert.equal(ch.race, 'Sylvari');
      });
    });
  });

  describe('Currencies', function () {
    it('Should return a list of currencies', function () {
      return api.getCurrencies().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });

    it('Should Return a single currency', function () {
      return api.getCurrencies(1).then(function (currency) {
        assert.equal(currency.name, 'Coin');
      });
    });

    it('Should Return multiple currencies', function () {
      return api.getCurrencies([1, 2]).then(function (res) {
        res.forEach(function (item) {
          if (item.id === 1) {
            assert.equal(item.name, 'Coin');
          } else {
            assert.equal(item.name, 'Karma');
          }
        });
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

  describe('Achievements', function () {
    it('Should get achievements', function () {
      return api.getAchievements().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });

    it('Should get a single achievement', function () {
      return api.getAchievements(1344).then(function (res) {
        assert.equal(res.name, "Live on the Edge");
      });
    });

    it('Should return daily achievements', function () {
      return api.getDailyAchievements().then(function (res) {
        assert.equal(res.pve.length > 0, true);
        assert.equal(typeof res.pve[0], 'object');
      });
    });
  });

  describe('Account', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it ('Should get account achievements', function () {
      return api.getAccountAchievements().then(function (achs) {
        assert.equal(achs.length > 10, true);
        assert.equal(achs[0].name, undefined);
      });
    });

    it('Should get deep account achievements', function () {
      return api.getAccountAchievements(true).then(function (achs) {
        assert.equal(achs.length > 10, true);
        assert(achs[0].name);
        assert(achs[7].name);
      });
    });

    it ('Should get account bank', function () {
      return api.getAccountBank().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
      });
    });

    it('Should get deep account bank', function () {
      return api.getAccountBank(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
        }
      });
    });

    it ('Should get account dyes', function () {
      return api.getAccountDyes().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
      });
    });

    it('Should get deep account dyes', function () {
      return api.getAccountDyes(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
        }
      });
    });

    it('Should get account materials', function () {
      return api.getAccountMaterials().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
      });
    });

    it('Should get deep account materials', function () {
      return api.getAccountMaterials(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
        }
      });
    });
  });

  describe('Skills', function () {
    it('Should get skills', function () {
      return api.getSkills().then(function (res) {
        assert.equal(res.length > 0, true);
      });
    });

    it('Should get a single skill', function () {
      return api.getSkills(30488).then(function (skill) {
        assert.equal(skill.name, '"Your Soul Is Mine!"');
      });
    });

    it('Should get multiple skills', function () {
      return api.getSkills([30488, 10527]).then(function (skills) {
        assert.equal(Array.isArray(skills), true);
        assert.equal(skills.length, 2);
      });
    });

    it('Should get profession skills', function () {
      return api.getProfessionSkills('Necromancer').then(function (skills) {
        skills.forEach(function (skill) {
          assert.equal(skill.professions.indexOf('Necromancer') != -1, true);
        });
      });
    });
  });
});
