/*
 * BROWSER
 */
(function () {
  "use strict";

  var App = module.exports
    , $ = require('jQuery')
    , domReady = $
    //, _ = require('underscore')
    , location = require('location')
    , LdsOrg = require('./lib/ldsorg')
    , Facecards = require('./lib/facecards')
    , request = require('ahr2')
    , shuffle = require('./lib/shuffle')
    ;

  function initWardMenuNative() {
    /*jshint scripturl:true */
    domReady(function () {
      request.get('/bookmarklet.min.js').when(function (err, ahr, data) {
        data = 'javascript:' + data.replace(/LOCATION_HOST/g, location.host);
        $('#js-bookmarklet').attr('href', data);
      });
    });
  }

  function uploadWardDeck(cards) {
    var deckId = window.prompt('Name this deck (should end with .json)')
      ;

    if (!/\.json$/.test(deckId)) {
      deckId += '.json';
      window.alert('deckId changed to ' + deckId);
    }

    console.log('got wards b');
    $.ajax({
        type: 'POST'
      , url: 'http://LOCATION_HOST/decks/' + deckId
      , contentType: 'application/json; charset=utf-8'
      , data: JSON.stringify(cards)
      , processData: false
      , success: function (data) {
          if (!data || !data.success) {
            window.alert('had error posting deck');
            return;
          }
          location.href = 'http://LOCATION_HOST#' + deckId;
        }
    });
  }

  function resetCounter(num) {
    if ('number' !== typeof num) {
      num = 0;
    }
    $('.js-member-counter').text(String(num));
  }
  function updateCounter(num) {
    if ('number' !== typeof num) {
      num = 1;
    }
    $('.js-member-counter').text(num + (Number($('.js-member-counter').text()) || 0));
  }
  function updateMemberTotal(memberList) {
    $('.js-member-total').text(memberList.length + (Number($('.js-member-total').text()) || 0));
  }

  function initLdsOrg() {
    var ldsOrg
      , fcHasRun = false
      , count = 0
      , minCount = 5
      , fc
      ;

    function startGettin() {
      ldsOrg.getCurrentWardProfiles(function (profiles) {
        console.log('I can haz all the ward member profilez!');
        App.fullMemberList = profiles;
      });
    }

    domReady(function () {
      $('#js-facecards-container').hide();
    });

    ldsOrg = LdsOrg.create();
    ldsOrg.init(startGettin, {
        memberList: updateMemberTotal
      //, profile: updateCounter
      , profile: function () {
          if (fcHasRun) {
            return;
          }
          if (count < minCount) {
            count += 1;
            return;
          }

          doStuff();
          fcHasRun = true;
          $('#js-facecards-container').show();
          $('#js-wm-loading').hide();
        }
    });


    fc = Facecards.create();
    function doStuff() {
      function gimmeSomeCards(cb) {
        ldsOrg.store.query(getWardMembers, { reduce: false }, function (err, profiles) {
          var cards
            ;
          //response.sort(randomize);
          cards = shuffle(profiles).map(function (p) {
            //var names = p.headOfHousehold.name.split(',')
            var names = p.householdPhotoName.split(',')
              , last = names.shift().trim()
              , name = names.join(', ').trim() + ' ' + last
                // TODO gender
                //, "imageData": h.imageData // added by download
              , card = { _id: p._id, name: name, thumbnail: null, imageData: p.imageData, householdId: p.householdId }
              ;

            return card;
          });
          App.cards = cards;
          cb(cards);
        });
      }

      function getWardMembers(doc) {
        /*globals emit:true*/
        if (doc.headOfHouseHold) {
          emit(null, doc);
        }
      }

      fc.init({
          "shuffle":  gimmeSomeCards
      });
    }
  }

  if (!/\blds.org\b/.test(location.host)) {
    initWardMenuNative();
    return;
  } else {
    LdsOrg.test(function (loggedIn) {
      if (loggedIn) {
        initLdsOrg();
      } else {
        // TODO open new window to login, poll, then close the window
        window.alert('Please log into LDS.org and this click on the bookmarklet again.');
        window.location = 'https://www.lds.org/directory/';
      }
    });
  }

  if (false) {
    // TODO attach event handler

    /*
    // TODO button for send e-mail to the whole ward
    households.forEach(function (m) {
      var email = m.householdInfo.email || m.headOfHousehold.email
        ;

      if (email) {
        emails.push(email);
      }
    });
    */

    // TODO get each image as imageData
/*
    function getPic(next, card) {
    }
      profile.photoUrl = profile.householdInfo.photoUrl || profile.headOfHousehold.photoUrl;
      getPic(onResult, profile);
*/

    uploadWardDeck();
  }

  App.fullMemberList = null;
  App.cards = null;
}());
