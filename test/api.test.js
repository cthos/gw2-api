var assert = require('assert');
var gw2 = require('../lib/index');
var md5 = require('md5');

console.log(gw2);

var api = new gw2.gw2();
var mem = new gw2.memStore();

api.setStorage(mem);

describe('GW2API', function () {
  this.retries(4);

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
    it('Should have 2 contients', function () {
      return api.getContinents().then(function (res) {
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

    it('Should store continents in cache', function () {
      return api.getContinents().then(function (res) {
        var continents = api.getStorage().getItem(md5('/continents'));
        continents = JSON.parse(continents);
        assert.equal(continents.length, 2);
        assert.deepEqual(res, continents);
      });
    });

    it('Should return different results on single item calls', function () {
      var itemResult1;

      return api.getItems(15).then(function (res) {
        itemResult1 = res;
        return api.getItems(411);
      }).then(function (res) {
        assert.notEqual(itemResult1.name, res.name);
      });
    });

    it('Should return different results on multiple item calls', function () {
      var itemResult1;

      return api.getItems([15, 411]).then(function (res) {
        itemResult1 = res;
        return api.getItems([15, 211]);
      }).then(function (res) {
        assert.notDeepEqual(itemResult1, res);
      });
    });

    it('Should return the same result on different id orders', function () {
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

  describe('Masteries', function () {
    /*
    it('Should get account Masteries without translating them', function () {
      return api.getAccountMasteries().then(function (masts) {
        assert.ok(masts[0].id);
        assert.equal(true, typeof masts[0].name === 'undefined');
      });
    });

    it('Should get account Masteries and translate them', function () {
      return api.getAccountMasteries(true).then(function (masts) {
        assert.ok(masts[0].id);
        assert.equal(true, typeof masts[0].name === 'string');
      });
    });
    */

    it('Should get a single Mastery', function () {
      return api.getMasteries(8).then(function (mastery) {
        assert.equal(mastery.name, 'Gliding');
      });
    });

    it('Should get a multiple Masteries', function () {
      return api.getMasteries([8, 13]).then(function (masteries) {
        var gliding = masteries.filter((m) => m.id === 8)[0];
        assert.ok(Array.isArray(masteries));
        assert.equal(gliding.name, 'Gliding');
      });
    });
  });

  describe('Finishers', function () {
    it('Should get account Finshers without translating them', function () {
      return api.getAccountFinishers().then(function (fins) {
        assert.ok(fins[0].id);
        assert.equal(true, typeof fins[0].name === 'undefined');
      });
    });

    it('Should get account Finishers and translate them', function () {
      return api.getAccountFinishers(true).then(function (fins) {
        assert.ok(fins[0].id);
        assert.equal(true, typeof fins[0].name === 'string');
      });
    });

    it('Should get a single Finisher', function () {
      return api.getFinishers(1).then(function (finisher) {
        assert.equal(finisher.name, 'Rabbit Rank Finisher');
      });
    });

    it('Should get a multiple Finishers', function () {
      return api.getFinishers([1, 2]).then(function (finishers) {
        var finisher = finishers.filter((m) => m.id === 1)[0];
        assert.ok(Array.isArray(finishers));
        assert.equal(finisher.name, 'Rabbit Rank Finisher');
      });
    });
  });

  describe('Items', function () {
    it('Should have items', function () {
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
    it('Should have materials', function () {
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
    it('Should have recipes', function () {
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

    it('Should search recipes by input', function () {
      return api.searchRecipes(46731).then(function (recipes) {
        assert(recipes.indexOf(7849) > -1);
      });
    });

    it('Should search recipes by output', function () {
      return api.searchRecipes(null, 50065).then(function (recipes) {
        assert(recipes.indexOf(8459) > -1);
        assert.equal(recipes.indexOf(8452), -1);
      });
    });

    it('Should fail searching if both input and output mats are present', function () {
      return api.searchRecipes(46731, 50065).catch(function (err) {
        assert.equal('inputItem and outputItem are mutually exclusive options', err);
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

    it('Should return deep daily achievements', function () {
      return api.getDailyAchievements(true).then(function (res) {
        assert.equal(res.pve.length > 0, true);
        assert.equal(typeof res.pve[0].name, 'string');
      });
    });

    it('Should get achievement groups', function () {
      return api.getAchievementGroups().then(function (groups) {
        assert(groups.length > 1);
      });
    });

    it('Should get a single achievement group', function () {
      return api.getAchievementGroups('65B4B678-607E-4D97-B458-076C3E96A810').then(function (group) {
        assert.equal(group.name, 'Heart of Thorns');
      });
    });

    it('Should get multiple achievement groups', function () {
      return api.getAchievementGroups(['65B4B678-607E-4D97-B458-076C3E96A810', 'A4ED8379-5B6B-4ECC-B6E1-70C350C902D2']).then(function (groups) {
        assert.equal(groups.length, 2);
      });
    });

    it('Should get achievement categories', function () {
      return api.getAchievementCategories().then(function (categories) {
        assert(categories.length > 1);
      });
    });

    it('Should get a single achievement category', function () {
      return api.getAchievementCategories(1).then(function (category) {
        assert.equal(category.name, 'Slayer');
      });
    });

    it('Should get multiple achievement categories', function () {
      return api.getAchievementCategories([1, 2]).then(function (categories) {
        assert.equal(categories.length, 2);
      });
    });
  });

  describe('Account', function () {
    before(function () {
      api.setAPIKey(process.env.API_KEY);
    });

    it('Should get account information', function () {
      return api.getAccount().then(function (acc) {
        assert.ok(acc.id);
      });
    });

    it('Should get account achievements', function () {
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

    it('Should get account bank', function () {
      return api.getAccountBank().then(function (items) {
        assert.equal(items.length > 10, true);

        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }

          assert.equal(items[i].name, undefined);
        }
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

    it('Should get account dyes', function () {
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

    /*
    it('Should get account masteries', function (done) {
      return api.getAccountMasteries().then(function (items) {
        console.log(items);
        assert.equal(items.length > 1, true);
        assert.equal(items[0].name, undefined);
        done();
      });
    });

    it('Should get deep account masteries', function (done) {
      return api.getAccountMasteries(true).then(function (items) {
        assert.equal(items.length > 1, true);
        
        for (var i = 0; i < 10; i++) {
          if (!items[i]) {
            continue;
          }
          assert(items[i].name);
        }
        done();
      });
    });
    */
   
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

    it('Should get account skins', function () {
      return api.getAccountSkins().then(function (skins) {
        assert.equal(skins.length > 10, true);
        assert.equal(skins[0].name, undefined);
      });
    });

    it('Should get deep account skins', function () {
      return api.getAccountSkins(true).then(function (skins) {
        assert.equal(skins.length > 10, true);
        for (var i = 0; i < 10; i++) {
          if (!skins[i]) {
            continue;
          }
          assert(skins[i].name);
        }
      });
    });

    it('Should get commerce transactions', function () {
      // TODO: This test could theoreticaly fail if the test API account doesn't
      // do any transactions for a while.
      return api.getCommerceTransactions(false, "buys").then(function (transactions) {
        // disable for now until we can test this properly.
        return;
        assert(transactions.length);
      });
    });

    it('Should get PVP Statistics', function () {
      return api.getPVPStats().then(function (pvp) {
        assert(pvp.professions.necromancer);
        assert(pvp.aggregate);
        assert(pvp.pvp_rank);
      });
    });

    it('Should get PVP games', function () {
      return api.getPVPGames().then(function (games) {
        assert(games.length);
      });
    });

    it('Should get Token Info', function () {
      return api.getTokenInfo().then(function (token) {
        assert(token.permissions);
      });
    });
  });

  describe('Specializations', function () {
    it('Should get specializations', function () {
      return api.getSpecializations().then(function (specs) {
        assert(specs.length);
      });
    });

    it('Should get a single specialization.', function () {
      return api.getSpecializations(1).then(function (spec) {
        assert.equal(spec.name, 'Dueling');
        assert.equal(spec.profession, 'Mesmer');
      });
    });

    it('Should get multiple specializations', function () {
      return api.getSpecializations([1, 2]).then(function (specs) {
        assert.equal(specs.length, 2);
      });
    });

    it('Should get profession specializations', function () {
      return api.getProfessionSpecializations('Necromancer').then(function (specs) {
        specs.forEach(function (spec) {
          assert.equal(spec.profession, 'Necromancer');
        });
      });
    });
  });

  describe('Guild', function () {
    it('Should get foreground emblem assets', function () {
      return api.getEmblems('foregrounds').then(function (assets) {
        assert(assets.length);
      });
    });

    it('Should get background emblem assets', function () {
      return api.getEmblems('backgrounds').then(function (assets) {
        assert(assets.length);
      });
    });

    it('Should get a specific foreground emblem asset', function () {
      return api.getEmblems('foregrounds', 1).then(function (assets) {
        assert.equal(assets.id, 1);
        assert(assets.layers);
      });
    });

    it('Should get a specific background emblem asset', function () {
      return api.getEmblems('backgrounds', 1).then(function (assets) {
        assert.equal(assets.id, 1);
        assert(assets.layers);
      });
    });

    it('Should get specific foreground emblem assets', function () {
      return api.getEmblems('foregrounds', [1, 2]).then(function (assets) {
        assert(assets[0].layers);
        assert(assets[1].layers);
      });
    });

    it('Should get specific background emblem assets', function () {
      return api.getEmblems('backgrounds', [1, 2]).then(function (assets) {
        assert(assets[0].layers);
        assert(assets[1].layers);
      });
    });

    it('Should get permission levels', function () {
      return api.getGuildPermissions().then(function (perms) {
        assert(perms.length);
      });
    });

    it('Should get a specific permission level', function () {
      return api.getGuildPermissions('Admin').then(function (perm) {
        assert.equal(perm.name, 'Admin Lower Ranks.');
      });
    });

    it('Should get multiple permission levels', function () {
      return api.getGuildPermissions(['Admin', 'ClaimableEditOptions']).then(function (perms) {
        assert(perms.length);
      });
    });

    it('Should get upgrades', function () {
      return api.getGuildUpgrades().then(function (ups) {
        assert(ups.length);
      });
    });

    it('Should get a specific upgrade', function () {
      return api.getGuildUpgrades(55).then(function (ups) {
        assert.equal(ups.name, 'Guild Treasure Trove');
      });
    });

    it('Should get multiple upgrades', function () {
      return api.getGuildUpgrades([55, 637]).then(function (ups) {
        assert(ups.length);
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

  describe('Commerce', function () {
    it('Should get commerce listings', function () {
      return api.getCommerceListings().then(function (listings) {
        // This should always be true.
        assert(listings.length > 100);
      });
    });

    it('Should get a single commerce listing', function () {
      return api.getCommerceListings(19684).then(function (listing) {
        assert(listing.buys.length);
      });
    });

    it('Should get multiple commerce listings', function () {
      return api.getCommerceListings([19684, 19709]).then(function (listing) {
        assert.equal(listing.length, 2);
      });
    });

    it('Should get Gem buy and sell prices', function () {
      return api.getCommerceExchange('gems', 100).then(function (exchange) {
        assert(exchange.coins_per_gem);
      });
    });

    it('Should get Coin buy and sell prices', function () {
      return api.getCommerceExchange('coins', 10000).then(function (exchange) {
        assert(exchange.coins_per_gem);
      });
    });
  });

  describe('WVW', function () {
    it('Should get WVW Matches', function () {
      return api.getWVWMatches(1005).then(function (matches) {
        assert(matches.id);
      });
    });

    it('Should get WVW Objectives', function () {
      return api.getWVWObjectives().then(function (objectives) {
        assert(objectives.length);
      });
    });

    it('Should get a single WVW Objective', function () {
      return api.getWVWObjectives('38-6').then(function (objectives) {
        assert.equal(objectives.name, 'Speldan Clearcut');
      });
    });

    it('Should get multiple WVW Objectives', function () {
      return api.getWVWObjectives(['38-6', '1143-117']).then(function (objectives) {
        assert.equal(objectives.length, 2);
      });
    });
  });

  describe('Misc', function () {
    it('Should get the build id', function () {
      return api.getBuildId().then(function (id) {
        assert(id.id);
      });
    });

    it('Should get Quaggans!!!', function () {
      return api.getQuaggans().then(function (quaggans) {
        assert(quaggans.length);
        assert(quaggans[0]);
      });
    });

    it('Should get the 404 quaggan, greatest of quaggans', function () {
      return api.getQuaggans('404').then(function (quaggans) {
        assert.equal(quaggans.id, '404');
      });
    });

    it('Should get a gaggle of quaggans', function () {
      return api.getQuaggans(['box', 'bear']).then(function (quaggans) {
        assert.equal(quaggans.length, 2);
      });
    });

    it('Should get files', function () {
      return api.getFiles().then(function (files) {
        assert(files.length);
      });
    });

    it('Should get a file', function () {
      return api.getFiles('map_complete').then(function (files) {
        assert.equal(files.id, 'map_complete');
      });
    });

    it('Should get multiple files', function () {
      return api.getFiles(['map_complete', 'map_dungeon']).then(function (files) {
        assert.equal(files.length, 2);
      });
    });
  });
});
