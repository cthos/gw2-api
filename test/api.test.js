var assert = require('assert');
var gw2 = require('../index');
var md5 = require('js-md5');

var api = new gw2.gw2();
var mem = new gw2.memStore();

api.setStorage(mem);

describe('GW2API', function () {
  describe('Auth', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it('Should get authed items via token', function (done) {
      api.getCharacters().then(function (ch) {
        assert(ch.length > 0);
        done();
      });
    });

    it('Should get authed items via GET param', function (done) {
      api.setUseAuthHeader(false);

      api.getCharacters().then(function (ch) {
        assert(ch.length > 0);

        api.setUseAuthHeader(true);
        done();
      });
    });
  });

  describe('Continents', function () {
    it('Should have 2 contients', function (done) {
      return api.getContinents().then(function(res) {
        assert.equal(res.length, 2);
        done();
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

    it ('Should store continents in cache', function (done) {
      return api.getContinents().then(function(res) {
        var continents = api.getStorage().getItem(md5('/continents'));
        continents = JSON.parse(continents);
        assert.equal(continents.length, 2);
        assert.deepEqual(res, continents);
        done();
      });
    });

    it ('Should return different results on single item calls', function (done) {
      var itemResult1;

      return api.getItems(15).then(function (res) {
        itemResult1 = res;
        return api.getItems(411);
      }).then(function (res) {
        assert.notEqual(itemResult1.name, res.name);
        done();
      });
    });

     it ('Should return different results on multiple item calls', function (done) {
      var itemResult1;

      return api.getItems([15, 411]).then(function (res) {
        itemResult1 = res;
        return api.getItems([15, 211]);
      }).then(function (res) {
        assert.notDeepEqual(itemResult1, res);
        done();
      });
    });

    it ('Should return the same result on different id orders', function (done) {
      var itemResult1;

      return api.getItems([15, 411]).then(function (res) {
        itemResult1 = res;
        return api.getItems([411, 15]);
      }).then(function (res) {
        assert.deepEqual(itemResult1, res);
        done();
      });
    });
  });

  describe('Characters', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it('Should get characters', function (done) {
      return api.getCharacters().then(function (res) {
        assert.equal(res.indexOf('Daginus') > -1, true);
        done();
      });
    });

    it('Should get a single Character', function (done) {
      return api.getCharacters('Daginus').then(function (ch) {
        assert.equal(ch.profession, 'Necromancer');
        assert.equal(ch.race, 'Sylvari');
        done();
      });
    });
  });

  describe('Currencies', function () {
    it('Should return a list of currencies', function (done) {
      return api.getCurrencies().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should Return a single currency', function (done) {
      return api.getCurrencies(1).then(function (currency) {
        assert.equal(currency.name, 'Coin');
        done();
      });
    });

    it('Should Return multiple currencies', function (done) {
      return api.getCurrencies([1, 2]).then(function (res) {
        res.forEach(function (item) {
          if (item.id === 1) {
            assert.equal(item.name, 'Coin');
          } else {
            assert.equal(item.name, 'Karma');
          }
        });
        done();
      });
    });
  });

  describe('Items', function () {
    it ('Should have items', function (done) {
      return api.getItems().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should get a single item', function (done) {
      return api.getItems(15).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.name, "Abomination Hammer");
        done();
      });
    });

    it('Should get multiple items', function (done) {
      return api.getItems([15, 411]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
        done();
      });
    });
  });

  describe('Materials', function () {
    it ('Should have materials', function (done) {
      return api.getMaterials().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should get a single material', function (done) {
      return api.getMaterials(5).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.name, "Cooking Materials");
        done();
      });
    });

    it('Should get multiple materials', function (done) {
      return api.getMaterials([5, 6]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
        assert.equal(res[0].name, "Cooking Materials");
        done();
      });
    });
  });

  describe('Recipes', function () {
    it ('Should have recipes', function (done) {
      return api.getRecipes().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should get a single recipe', function (done) {
      return api.getRecipes(7319).then(function (res) {
        assert.equal(Array.isArray(res), false);
        assert.equal(res.output_item_id, 46742);
        done();
      });
    });

    it('Should get multiple recipes', function (done) {
      return api.getRecipes([1, 2]).then(function (res) {
        assert.equal(Array.isArray(res), true);
        assert.equal(res.length, 2);
        done();
      });
    });

    it('Should search recipes by input', function (done) {
      return api.searchRecipes(46731).then(function (recipes) {
        assert(recipes.indexOf(7840) > -1);
        done();
      });
    });

    it('Should search recipes by output', function (done) {
      return api.searchRecipes(null, 50065).then(function (recipes) {
        assert(recipes.indexOf(8459) > -1);
        assert.equal(recipes.indexOf(8452), -1);
        done();
      });
    });

    it('Should fail searching if both input and output mats are present', function (done) {
      return api.searchRecipes(46731, 50065).catch(function (err) {
        assert.equal('inputItem and outputItem are mutually exclusive options', err);
        done();
      });
    });
  });

  describe('Achievements', function () {
    it('Should get achievements', function (done) {
      return api.getAchievements().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should get a single achievement', function (done) {
      return api.getAchievements(1344).then(function (res) {
        assert.equal(res.name, "Live on the Edge");
        done();
      });
    });

    it('Should return daily achievements', function (done) {
      return api.getDailyAchievements().then(function (res) {
        assert.equal(res.pve.length > 0, true);
        assert.equal(typeof res.pve[0], 'object');
        done();
      });
    });

    it('Should get achievement groups', function (done) {
      return api.getAchievementGroups().then(function (groups) {
        assert(groups.length > 1);
        done();
      });
    });

    it('Should get a single achievement group', function (done) {
      return api.getAchievementGroups('65B4B678-607E-4D97-B458-076C3E96A810').then(function(group) {
        assert.equal(group.name, 'Heart of Thorns');
        done();
      });
    });

    it('Should get multiple achievement groups', function (done) {
      return api.getAchievementGroups(['65B4B678-607E-4D97-B458-076C3E96A810', 'A4ED8379-5B6B-4ECC-B6E1-70C350C902D2']).then(function(groups) {
        assert.equal(groups.length, 2);
        done();
      });
    });

    it('Should get achievement categories', function (done) {
      return api.getAchievementCategories().then(function (categories) {
        assert(categories.length > 1);
        done();
      });
    });

    it('Should get a single achievement category', function (done) {
      return api.getAchievementCategories(1).then(function(category) {
        assert.equal(category.name, 'Slayer');
        done();
      });
    });

    it('Should get multiple achievement categories', function (done) {
      return api.getAchievementCategories([1, 2]).then(function(categories) {
        assert.equal(categories.length, 2);
        done();
      });
    });
  });

  describe('Account', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it ('Should get account achievements', function (done) {
      return api.getAccountAchievements().then(function (achs) {
        assert.equal(achs.length > 10, true);
        assert.equal(achs[0].name, undefined);
        done();
      });
    });

    it('Should get deep account achievements', function (done) {
      return api.getAccountAchievements(true).then(function (achs) {
        assert.equal(achs.length > 10, true);
        assert(achs[0].name);
        assert(achs[7].name);
        done();
      });
    });

    it ('Should get account bank', function (done) {
      return api.getAccountBank().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
        done();
      });
    });

    it('Should get deep account bank', function (done) {
      return api.getAccountBank(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
        }
        done();
      });
    });

    it ('Should get account dyes', function (done) {
      return api.getAccountDyes().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
      });
      done();
    });

    it('Should get deep account dyes', function (done) {
      return api.getAccountDyes(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
          done();
        }
      });
    });

    it('Should get account materials', function (done) {
      return api.getAccountMaterials().then(function (items) {
        assert.equal(items.length > 10, true);
        assert.equal(items[0].name, undefined);
      });
      done();
    });

    it('Should get deep account materials', function (done) {
      return api.getAccountMaterials(true).then(function (items) {
        assert.equal(items.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
          done();
        }
      });
    });

    it('Should get account skins', function (done) {
      return api.getAccountSkins().then(function (skins) {
        assert.equal(skins.length > 10, true);
        assert.equal(skins[0].name, undefined);
      });
      done();
    });

    it('Should get deep account skins', function (done) {
      return api.getAccountSkins(true).then(function (skins) {
        assert.equal(skins.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!skins[i]) {
            continue;
          }
          assert(skins[i].name);
        }
        done();
      });
    });

    it('Should get commerce transactions', function (done) {
      // TODO: This test could theoreticaly fail if the test API account doesn't
      // do any transactions for a while.
      return api.getCommerceTransactions(false, "buys").then(function (transactions) {
        assert(transactions.length);
        done();
      });
    });

    it('Should get PVP Statistics', function (done) {
      return api.getPVPStats().then(function (pvp) {
        assert(pvp.professions.necromancer);
        assert(pvp.aggregate);
        assert(pvp.pvp_rank);
        done();
      });
    });

    it('Should get PVP games', function (done) {
      return api.getPVPGames().then(function (games) {
        assert(games.length);
        done();
      });
    });

    it('Should get Token Info', function (done) {
      return api.getTokenInfo().then(function (token) {
        assert(token.permissions);
        done();
      });
    });
  });

  describe('Specializations', function () {
    it('Should get specializations', function (done) {
      return api.getSpecializations().then(function (specs) {
        assert(specs.length);
        done();
      });
    });

    it('Should get a single specialization.', function (done) {
      return api.getSpecializations(1).then(function (spec) {
        assert.equal(spec.name, 'Dueling');
        assert.equal(spec.profession, 'Mesmer');
        done();
      });
    });

    it('Should get multiple specializations', function (done) {
      return api.getSpecializations([1,2]).then(function(specs) {
        assert.equal(specs.length, 2);
        done();
      });
    });

    it('Should get profession specializations', function (done) {
      return api.getProfessionSpecializations('Necromancer').then(function (specs) {
        specs.forEach(function (spec) {
          assert.equal(spec.profession, 'Necromancer');
        });
        done();
      });
    });
  });

  describe('Guild', function () {
    it('Should get foreground emblem assets', function (done) {
      return api.getEmblems('foregrounds').then(function (assets) {
        assert(assets.length);
        done();
      });
    });

    it('Should get background emblem assets', function (done) {
      return api.getEmblems('backgrounds').then(function (assets) {
        assert(assets.length);
        done();
      });
    });

    it('Should get a specific foreground emblem asset', function (done) {
      return api.getEmblems('foregrounds', 1).then(function (assets) {
        assert.equal(assets.id, 1);
        assert(assets.layers);
        done();
      });
    });

    it('Should get a specific background emblem asset', function (done) {
      return api.getEmblems('backgrounds', 1).then(function (assets) {
        assert.equal(assets.id, 1);
        assert(assets.layers);
        done();
      });
    });

    it('Should get specific foreground emblem assets', function (done) {
      return api.getEmblems('foregrounds', [1, 2]).then(function (assets) {
        assert(assets[0].layers);
        assert(assets[1].layers);
        done();
      });
    });

    it('Should get specific background emblem assets', function (done) {
      return api.getEmblems('backgrounds', [1, 2]).then(function (assets) {
        assert(assets[0].layers);
        assert(assets[1].layers);
        done();
      });
    });

    it('Should get permission levels', function (done) {
      return api.getGuildPermissions().then(function (perms) {
        assert(perms.length);
        done();
      });
    });

    it('Should get a specific permission level', function (done) {
      return api.getGuildPermissions('Admin').then(function (perm) {
        assert.equal(perm.name, 'Admin Lower Ranks.');
        done();
      });
    });

    it('Should get multiple permission levels', function (done) {
      return api.getGuildPermissions(['Admin', 'ClaimableEditOptions']).then(function (perms) {
        assert(perms.length);
        done();
      });
    });

    it('Should get upgrades', function (done) {
      return api.getGuildUpgrades().then(function (ups) {
        assert(ups.length);
        done();
      });
    });

    it('Should get a specific upgrade', function (done) {
      return api.getGuildUpgrades(55).then(function (ups) {
        assert.equal(ups.name, 'Guild Treasure Trove');
        done();
      });
    });

    it('Should get multiple upgrades', function (done) {
      return api.getGuildUpgrades([55, 637]).then(function (ups) {
        assert(ups.length);
        done();
      });
    });
  });

  describe('Skills', function () {
    it('Should get skills', function (done) {
      return api.getSkills().then(function (res) {
        assert.equal(res.length > 0, true);
        done();
      });
    });

    it('Should get a single skill', function (done) {
      return api.getSkills(30488).then(function (skill) {
        assert.equal(skill.name, '"Your Soul Is Mine!"');
        done();
      });
    });

    it('Should get multiple skills', function (done) {
      return api.getSkills([30488, 10527]).then(function (skills) {
        assert.equal(Array.isArray(skills), true);
        assert.equal(skills.length, 2);
        done();
      });
    });

    it('Should get profession skills', function (done) {
      return api.getProfessionSkills('Necromancer').then(function (skills) {
        skills.forEach(function (skill) {
          assert.equal(skill.professions.indexOf('Necromancer') != -1, true);
        });
        done();
      });
    });
  });

  describe('Commerce', function () {
    it('Should get commerce listings', function (done) {
      return api.getCommerceListings().then(function (listings) {
        // This should always be true.
        assert(listings.length > 100);
        done();
      });
    });

    it('Should get a single commerce listing', function (done) {
      return api.getCommerceListings(19684).then(function (listing) {
        assert(listing.buys.length);
        done();
      });
    });

    it('Should get multiple commerce listings', function (done) {
      return api.getCommerceListings([19684, 19709]).then(function (listing) {
        assert.equal(listing.length, 2);
        done();
      });
    });

    it('Should get Gem buy and sell prices', function (done) {
      return api.getCommerceExchange('gems', 100).then(function (exchange) {
        assert(exchange.coins_per_gem);
        done();
      });
    });

    it('Should get Coin buy and sell prices', function (done) {
      return api.getCommerceExchange('coins', 10000).then(function (exchange) {
        assert(exchange.coins_per_gem);
        done();
      });
    });
  });

  describe('WVW', function () {
    it('Should get WVW Matches', function (done) {
      return api.getWVWMatches(1005).then(function (matches) {
        assert(matches.id);
        done();
      });
    });

    it('Should get WVW Objectives', function (done) {
      return api.getWVWObjectives().then(function (objectives) {
        assert(objectives.length);
        done();
      });
    });

    it('Should get a single WVW Objective', function (done) {
      return api.getWVWObjectives('38-6').then(function (objectives) {
        assert.equal(objectives.name, 'Speldan Clearcut');
        done();
      });
    });

    it('Should get multiple WVW Objectives', function (done) {
      return api.getWVWObjectives(['38-6', '1143-117']).then(function (objectives) {
        assert.equal(objectives.length, 2);
        done();
      });
    });
  });

  describe('Misc', function () {
    it('Should get the build id', function (done) {
      return api.getBuildId().then(function (id) {
        assert(id.id);
        done();
      });
    });

    it('Should get Quaggans!!!', function (done) {
      return api.getQuaggans().then(function (quaggans) {
        assert(quaggans.length);
        assert(quaggans[0]);
        done();
      });
    });

    it('Should get the 404 quaggan, greatest of quaggans', function (done) {
      return api.getQuaggans('404').then(function (quaggans) {
        assert.equal(quaggans.id, '404');
        done();
      });
    });

    it('Should get a gaggle of quaggans', function (done) {
      return api.getQuaggans(['box', 'bear']).then(function (quaggans) {
        assert.equal(quaggans.length, 2);
        done();
      });
    });

    it('Should get files', function (done) {
      return api.getFiles().then(function (files) {
        assert(files.length);
        done();
      });
    });

    it('Should get a file', function (done) {
      return api.getFiles('map_complete').then(function (files) {
        assert.equal(files.id, 'map_complete');
        done();
      });
    });

    it('Should get multiple files', function (done) {
      return api.getFiles(['map_complete', 'map_dungeon']).then(function (files) {
        assert.equal(files.length, 2);
      });
    });
  });
});
