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
		
		it('Should get as single item', function () {
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
});