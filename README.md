WardMenu
===

  0. Install NodeJS <http://nodejs.org>

  1. Install wardmenu

        git clone git://github.com/coolaj86/wardmenu.git
        cd wardmenu
        npm install -g grunt-cli
        npm install
        grunt build
        node bin/server 9000

  2. Open <http://localhost:9000>

Goals
===

Luke 16:8 - And the lord commended the unjust steward, because he had done wisely: for the children of this world are in their generation wiser than the children of light.

A lot of research has gone into customer retention, social networking, increasing engagement in a community, etc.

Therefore let us learn from the children of this world and so be wise.


  * New member form
  * Notify when a person enters or exists the ward
  * update member profile
  * encourage seeking inspiration when choosing callings

D&C - Study it out in your mind (not that the data should be the focus,
but you do need data for that part).

next up
---

* Change profile pic, phone number, preferred name, etc from a single form
* Code Cleanup
* standardize on a single view (instead of all of member, photo, household, individual)

LdsOrg.js API
===

methods

  * getStakeInfo(cb) - returns a combination of `/unit/current-user-ward-stake/` and `/unit/current-user-units/`
  * getWard(unitNo, cb) - returns a combination of `/mem/member-list/:ward_unit_no` and `/mem/wardDirectory/photos/`
  * getWards(unitNos, cb) - returns an array of the above
  * getCurrentStakeProfiles(cb) - calls `getStakeInfo` and `getWards` to get the user's current stake directory
  * getCurrentWardProfiles(cb) - calls `getStakeInfo` and `getWard` on the user's ward
  * getHousehold(profileOrId, cb) - takes a member profile or a member id and return '/mem/householdProfile/'
  * getHouseholds(profilesOrIds, cb) - takes an array of member profiles or ids

experimental methods

  * signin(cb) - doesn't always work - attempts to have the user login through a popup...
    an `iframe` with `window.postMessage` might be a better choice
    `$('#iframe_').contents().find('body').append(script)`

Other notes:

I suspect that if you log in as an area authority you get more resource that would allow you to get the data
for an entire area, but that information is beyond my privileges.

### Local Cache

Because LDS.org is unheavenly slow and all of the picture resources expire after about 10 minutes,
it's convenient (if not necessary) to cache the data.

[IndexedDB](https://developer.mozilla.org/en-US/docs/IndexedDB) has a storage limit of 50MiB,
which is more than sufficient and it is also available, even on crappy browsers using the
IndexedDB Polyfill, [IndexedDBShim](http://nparashuram.com/IndexedDBShim/).

[PouchDB](http://pouchdb.com/) was chosen as the storage engine because, well, it's easy to use.

  * Individual Profile Data
    * '/mem/householdProfile/'
    * `jointProfile.headOfHousehold.photoUrl || jointProfile.householdInfo.photoUrl || jointProfile.photoUrl`
    * stored as `'profile' + profileOrId.householdId || member.headOfHouseIndividualId`

lds.org API Overview & Playground
===

Go log into [LDS.org/directory](https://www.lds.org/directory) and then start clicking on the links below to what the api looks like.

I'd also recommend installing the Chrome Plugin
[JSONView](https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc)
for easy formatting of the data.

  * [LDS.org](https://www.lds.org/)
    * Calendar - [lds.org/church-calendar/services/lucrs/](https://www.lds.org/church-calendar/services/lucrs/)
      * [/mem/hasViewedDirectoryWelcomeMsg/](https://www.lds.org/church-calendar/services/lucrs/mem/hasViewedDirectoryWelcomeMsg/)
    * Directory - [lds.org/directory/services/ludrs](https://www.lds.org/directory/services/ludrs/)
      * Version - [/util/ver/](https://www.lds.org/directory/services/ludrs/util/ver/)
      * Locale - [/userLocale/](https://www.lds.org/directory/services/ludrs/page/userLocale/)
      * Page Translation - [/page/str/index](https://www.lds.org/directory/services/ludrs/page/str/index)
      * Ward Metadata - [/unit/current-user-ward-stake/](https://www.lds.org/directory/services/ludrs/unit/current-user-ward-stake/)
      * Stake Metadata - [/unit/current-user-units/](https://www.lds.org/directory/services/ludrs/unit/current-user-units/)
      * User Id - [/mem/current-user-id/](https://www.lds.org/directory/services/ludrs/mem/current-user-id/)
      * Ward Member List - [/mem/member-list/:unit_number](https://www.lds.org/directory/services/ludrs/mem/member-list/:unit_number)
      * Ward Photo List - [/mem/householdProfile/:head_of_house_individual_id](https://www.lds.org/directory/services/ludrs/mem/householdProfile/:head_of_house_individual_id)
      * Household - [/directory/services/ludrs/mem/householdProfile/:head_of_house_individual_id](https://www.lds.org/directory/services/ludrs/mem/householdProfile/:head_of_house_individual_id)

LDS.org Directory
===

Documentation for the LDS.org Directory based on web debugger inspection.

<https://www.lds.org>

Version
===

    GET /directory/services/ludrs/util/ver/

Stake
===

    GET /directory/services/ludrs/unit/current-user-units/

    [
      {
        "district": false,
        "mission": false,
        "stake": true,
        "stakeName": "Provo Utah YSA 10th Stake",
        "stakeUnitNo": 555555,
        "userHasStakeAdminRights": false,
        "wards": [
            {
              "areaUnitNo": 777777,
              "branch": false,
              "district": false,
              "mission": false,
              "newPhotoCount": -1,
              "stake": true,
              "stakeName": "Provo Utah YSA 10th Stake",
              "stakeUnitNo": 555555,
              "userHasStakeAdminRights": false,
              "userHasWardAdminRights": false,
              "userHasWardCalling": false,
              "usersHomeWard": true,
              "ward": true,
              "wardName": "Provo YSA 147th Ward",
              "wardUnitNo": 222222
            }
        ]
      }
    ]

The `current-user-units` will be a collection of wards and / or branches of the currently logged-in user.

Ward
===

All wards are listed as the stake

    GET /directory/services/ludrs/unit/current-user-ward-stake/

    {
        "areaUnitNo": 777777,
        "branch": false,
        "district": false,
        "mission": false,
        "newPhotoCount": -1,
        "stake": true,
        "stakeName": "Provo Utah YSA 10th Stake",
        "stakeUnitNo": 555555,
        "userHasStakeAdminRights": false,
        "userHasWardAdminRights": false,
        "userHasWardCalling": false,
        "usersHomeWard": true,
        "ward": true,
        "wardName": "Provo YSA 147th Ward",
        "wardUnitNo": 222222
    }

Individual wards contain the list of members

    GET /directory/services/ludrs/mem/member-list/:ward_unit_no

    [
        {
          "children": [],
          "coupleName": "O'Neal, AJ",
          "headOfHouse": {
            "directoryName": "O'Neal, AJ",
            "gender": "MALE",
            "individualId": 3333333333,
            "latinName": "O'Neal",
            "latinNameDifferent": false,
            "preferredName": "O'Neal, AJ",
            "surname": "O'Neal"
          },
          "headOfHouseIndividualId": 3333333333,
          "householdName": "O'Neal",
          "isProfilePrivate": false,
          "spouse": {
            "directoryName": "",
            "gender": "",
            "individualId": -1,
            "latinName": "",
            "latinNameDifferent": true,
            "preferredName": "",
            "surname": ""
          }
        }
    ]

Photos
===

Phone Numbers are only visible via the photos resource.

The photos are already available in the household resource.

  * headOfHousehold.photoUrl
  * householdInfo.photoUrl

The phone number can be accessed like so

    GET /directory/services/ludrs/mem/wardDirectory/photos/:ward_unit_no

    [
        {
          "householdId": 3333333333,
          "householdName": "O'Neal, AJ",
          "phoneNumber": "317-426-6525",
          "photoUrl": "/bcs/content?token=6zr5CJL5hQ7QdxHZZp8LG_aKQWafJ8x0V8gyTExIvoEZcCmlBICSabVO7rF7JIOR6y94HWsYKNCtilHK6fJTfwTT-mR0SV8_jKm7lRcobsfgpDnVHl3_EV1z3Ysnj30EZIHQ7EbIxXE6zzY-d_9x5W43mrnJJI-N%3dt_U1ZvJ4jZiRhx7S8KlE%3dXWMv0Vbv6i1ySrWhMTlqK6EQbhhqG0MsWNUtM4PsG%3d%3dvIlgKoLQFWgCHX5A9k_nix9iPPZezcE8BoobjcsJ2WTXlKF7WnC7hsu"
        }
    ]

Household
===

    GET /directory/services/ludrs/mem/householdProfile/:head_of_house_individual_id

    {
      "canViewMapLink": true,
      "hasEditRights": true,
      "headOfHousehold": {
        "address": null,
        "addressLevel": null,
        "birthDateLevel": "WARD",
        "email": "coolaj86@gmail.com",
        "emailLevel": "STAKE",
        "imageId": "51963879243749023320-eng",
        "imageLevel": "STAKE",
        "individualId": 3333333333,
        "isAllPrivate": false,
        "mapLevel": null,
        "masterLevel": null,
        "name": "O'Neal, AJ",
        "phone": "317-426-6525",
        "phoneLevel": "STAKE",
        "photoUrl": "/bcs/content?token=uDglPJ4yUAOSRRcKZLwOSfCRPTmeIooHisTFIVpJj4YZcCmlBICSabVO7rF7JIOR6y94HWwYKNCti1HK6g7oigXS-np0SV8_jKm7lRcobsfgpDnVHl3_EV1z3Ysnj30EZIHQ7EbIxXE6zzY-d_9x5W43mrnJJI-N%3dt_U1ZvJ4jZiRhx7S8KlE%3dTYMwkVbf5n2SSrpfwUqJK6EQbhhqG0MsWNUtM4PsG%3d%3dvILfM9LClvgCHXOBdh6zRx2cyHZek1R7io4bjcsJ2WTXlKF7WnC7hsu"
      },
      "householdInfo": {
        "address": {
          "addr1": "728 W 1720 N apt 219",
          "addr2": "Provo, Utah 84604",
          "addr3": "",
          "addr4": "",
          "addr5": "",
          "city": "Provo",
          "countryCode": 251,
          "countryIsoAlphaCode": "USA",
          "district": "",
          "groupId": 1670219,
          "latitude": 40.2599249,
          "locallyVerifiedCode": "",
          "longitude": -111.6556598,
          "postal": "84604",
          "state": "Utah",
          "stateCode": 44,
          "streetAddr1": "728 W 1720 N apt 219",
          "streetAddr2": ""
        },
        "addressLevel": "STAKE",
        "birthDateLevel": null,
        "email": "coolaj86@gmail.com",
        "emailLevel": "STAKE",
        "imageId": "72558875098790051910-eng",
        "imageLevel": "STAKE",
        "individualId": 3333333333,
        "isAllPrivate": false,
        "mapLevel": "STAKE",
        "masterLevel": "STAKE",
        "name": "O'Neal",
        "phone": "317-426-6525",
        "phoneLevel": "STAKE",
        "photoUrl": "/bcs/content?token=vTklO9Elgg2mSRgKPcAAHy%3dAR0dyIr0GVvkuT1S4jo5ZcCmlBICSabVO7rF7JIOR6y94HWwYKNCti1HK5BSohf_SCmh0SV8_jKm7lRcobsfgpDnVHl3_EV1z3Ysnj30EZIHQ7EbIxXE6zzY-d_9x5W43mrnJJI-N%3dt_U1ZvJ4jZiRhx7S8KlE%3dXWMv0Vbv6i1ySrWhMTlqK6EQbhhqG0MsWNUtM4PsG%3d%3dvIlgKoLQFWgCHX5A9k_nix9iPPZezcE8BoobjcsJ2WTXlKF7WnC7hsu"
      },
      "id": 0,
      "inWard": true,
      "isEuMember": false,
      "otherHouseholdMembers": [],
      "spouse": null,
      "ward": {
        "areaUnitNo": 777777,
        "branch": false,
        "district": false,
        "mission": false,
        "stake": true,
        "stakeName": "Provo Utah YSA 10th Stake",
        "stakeUnitNo": 555555,
        "ward": true,
        "wardName": "Provo YSA 147th Ward",
        "wardUnitNo": 222222
      }
    }

Member
===

There are no individual records accessible via the Directory. Only household and head of household.

Phone Numbers are only visible via the photos resource.

The only individual data is about the current user.

    GET /directory/services/ludrs/mem/current-user-id/

    GET /directory/services/ludrs/page/userLocale/

Photo Upload
---

The flash uploader tool does some image manipulation on the file you upload
and actually produces 3 separate files which are uploaded to the server.

Despite the name, the *original* version is **not** the true original.
Although I was able to capture a HAR file of the upload,
the jpeg binary got messed up in the utf-8 conversion
and I wasn't able to decode it.

What I do know however is that when you upload the recommended 500x375 image (4:3),
it is downsized to 200x150 (4:3) for family photos and perhaps 100x? for individual photos.
I also know that lds.org uses a 40x40 thumbnail.

My *guess* is that compression is increased on the original size image,
the image is scaled to whatever fits best in the bounds of 200x150
and then (intelligently?) cropped to 40x40
(or at least it seems to do a good job of getting the face).

    POST /directory/services/ludrs/photo/upload/:individual_id/household/:ward_unit_no}/:stake_unit_no/:area_unit_no

    name="file0"; filename="original_:picname.jpg"
    name="file1"; filename="medium_:picname.jpg" 200x150 (height is exactly 150, width may be up to 150 or 200)
    name="file1"; filename="thumbnail_:picname.jpg" 40x40 ()

    {"good":true,"message":""}
