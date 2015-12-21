# GW2-API

![Build Status](https://travis-ci.org/cthos/gw2-api.svg?branch=master)

This is a node module which is designed to facilitate communication with the Guild Wars 2 API.

The goal is to provide some convenience methods around getting things out of the API. This includes ways to cache API call results in memory, localStorage, or whatever storage system you desire. This is useful for the big aggregate lists (for example `/items`).

## Instructions

The `gw2` package comes with 2 objects exported. `gw2` is the actual interface to the API with a default storage mechanism of `localStorage`. Since this isn't available in all applications, it also provides `memStore`, which simply caches things in RAM. Storage can also be disabled by calling `api.setCache(false)`.

## API Documentation

TODO

## Example

```js
var gw2 = require('gw2-api');
var api = new gw2.gw2();

// Set storage system to RAM if no access to localStorage
api.setStorage(new gw2.memStore());

// Get daily pve achievement names:
api.getDailyAchievements().then(function (res) {
  if (!res.pve) {
    return;
  }

  var achievementIds = [];

  for (var i = 0, len = res.pve.length; i < len; i++) {
    achievementIds.push(res.pve[i].id);
  }

  return api.getAchievements(achievementIds);
}).then(function (res) {
  for (var i = 0, len = res.length; i < len; i++) {
    console.log(res[i].name);
  }
});

// Get all character names associated with an account.
api.setAPIKey('YOUR-TOKEN-GOES-HERE');

api.getCharacters().then(function (res) {
  for (var i = 0, len = res.length; i < len; i++) {
    // This API call just returns an array of string character names.
    console.log(res[i]);
  }
});

// Get Character Details
api.getCharacters('Zojja').then(function (res) {
  console.log(res);
});
```
