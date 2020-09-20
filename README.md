## ⚠️ This repository has moved to gitlab.

Please visit here for project updates: https://gitlab.com/cthos/gw2-api/

This project will no longer be maintained on Github.

## GW2-API

![Build Status](https://travis-ci.org/cthos/gw2-api.svg?branch=master)

> ⚠️ 3.0.0 is a breaking change, and changes how the project is compiled / exported. I've not _quite_ made a UMD bundle for this yet.

This is a node module which is designed to facilitate communication with the Guild Wars 2 API. It is fan maintained, and has no official relationship with Arenanet or GuildWars 2 (legal disclaimer at the bottom).

The goal is to provide some convenience methods around getting things out of the API. This includes ways to cache API call results in memory, localStorage, or whatever storage system you desire. This is useful for the big aggregate lists (for example `/items`).

## Instructions

The `gw2` package comes with 2 objects exported. `gw2` is the actual interface to the API with a default storage mechanism of `localStorage`. Since this isn't available in all applications, it also provides `memStore`, which simply caches things in RAM. Storage can also be disabled by calling `api.setCache(false)`.

## API Documentation

[Static API Documentation Page](http://cthos.github.com/gw2-api)

## Example (for ^3.0.0)

### Typescript
```ts
import {GW2API, Memstore} from '@cthos/gw2-api';

const api = new GW2API();

// Set storage system to RAM if no access to localStorage
api.setStorage(new Memstore());

// Get daily pve achievement names:
const achievements = await api.getDailyAchievements(true); // the true is default, but this will translate the IDs to their objects directly
const achievementNames = achievements.map(a => a.name);

// Get all character names associated with an account.
await api.setAPIKey('YOUR-TOKEN-GOES-HERE');

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

### Javascript

## Example (for 2.2.2)

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

### Legal stuff

Use of the Guild Wars 2 API constitutes compliance with the [Content Terms of Use](https://www.guildwars2.com/en/legal/guild-wars-2-content-terms-of-use/) and the [Website Terms of Use](https://www.guildwars2.com/en/legal/website-terms-of-use/).

Full API documentation is found on the [Wiki](https://wiki.guildwars2.com/wiki/API:Main).

Their copyright notice is:
```
© 2015 ArenaNet, LLC. All rights reserved. NCSOFT, the interlocking NC logo, ArenaNet, Guild Wars, Guild Wars Factions, Guild Wars Nightfall, Guild Wars: Eye of the North, Guild Wars 2, Heart of Thorns, and all associated logos and designs are trademarks or registered trademarks of NCSOFT Corporation. All other trademarks are the property of their respective owners.
```
