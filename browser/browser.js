/*
 * BROWSER
 */
(function () {
  "use strict";

  // override ender madness
  window.$ = window.jQuery;

  var App = module.exports
    , $ = require('jQuery')
    , domReady = $
    //, _ = require('underscore')
    , location = require('location')
    , forEachAsync = require('./lib/forEachAsync')
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

  /*
  function resetCounter(num) {
    if ('number' !== typeof num) {
      num = 0;
    }
    $('.js-member-counter').text(String(num));
  }
  */
  function updateCounter(num) {
    if ('number' !== typeof num) {
      num = 1;
    }
    $('.js-member-counter').text(num + (Number($('.js-member-counter').text()) || 0));
  }
  function updateMemberTotal(memberList) {
    $('.js-member-total').text(memberList.length || 0);
  }

  function initLdsOrg() {
    console.log('initLdsOrg');
    var ldsOrg
      , fcHasRun = false
      , count = 0
      , minCount = 3
      , fc
      ;

    function startGettin() {
      ldsOrg.getCurrentWardProfiles(function (profiles) {
        App.fullMemberList = profiles;
        forEachAsync(profiles, function (next, profile) {
          ldsOrg.getHousehold(function () {
            updateCounter();
            next();
          }, profile);
        }).then(function () {
          console.log('got all profiles');
        });
      });
    }

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

          getDataAndCreateCards();
          fcHasRun = true;
          $('#js-facecards-container').show();
          //$('#js-wm-loading').hide();
        }
    });


    fc = Facecards.create();
    function getDataAndCreateCards() {
      function gimmeSomeCards(cb) {
        function formatAndForward(err, data) {
          var cards
            , profiles = data && data.rows
            ;

          function mapProfileToCard(p) {
            p = p.value;

            var person = p.headOfHousehold || p.headOfHous
              , names = (person.preferredName || person.name).split(',') //householdPhotoName.split(',')
              , last = names.shift().trim()
              , name = names.join(', ').trim() + ' ' + last
                // TODO gender
                //, "imageData": h.imageData // added by download
              , card = { _id: p._id, name: name, thumbnail: null, imageData: p.imageData, householdId: p.householdId }
              ;

            return card;
          }

          function hasImageData(c) {
            if (c.imageData || c.thumbnail) {
              return true;
            }
          }

          cards = shuffle(profiles).map(mapProfileToCard).filter(hasImageData);
          App.cards = cards;
          cb(cards);
        }
        ldsOrg.store.query(getWardMembers, { reduce: false }, formatAndForward);
      }

      function getWardMembers(doc) {
        /*globals emit:true*/
        if (doc.headOfHousehold) {
          emit(null, doc);
        }
      }

      // use ward list rather than deck
      function gimmeSearchResults(cb) {
        function reformatAndForward(profiles) {
          console.log('[getCurrentWardProfiles.results]', profiles);
          var miniCards
            ;

          function memberListToMiniCard(p) {
            var names = p.headOfHouse.preferredName.split(',') //householdPhotoName.split(',')
              , last = names.shift().trim()
              , name = names.join(', ').trim() + ' ' + last
              , card = { _id: p._id, name: name, thumbnail: null, imageData: p.imageData, householdId: p.householdId
                  , toLowerCase: function () { return name.toLowerCase(); }, toString: function () { return name; } }
              ;

            return name;
          }

          miniCards = profiles.map(memberListToMiniCard);
          cb(miniCards);
        }

        ldsOrg.getCurrentWardProfiles(reformatAndForward);
      }

      fc.init({
          "shuffle":  gimmeSomeCards
        , "search": gimmeSearchResults
      });
    }
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

  $.get('http://thewardmenu.com/js/bootstrap.js', function (jsText) {
    // some crazy illegal token hack
    $(['<sc', 'ript>'].join('') + jsText + '</' + 'script' + '>').appendTo('head');

    if (!/\blds.org\b/.test(location.host)) {
      initWardMenuNative();
    } else {
      $('body').children().addClass('js-ldsorg-original-content');
      $('#js-wm-root').removeClass('js-ldsorg-original-content');
      $('.js-ldsorg-original-content').fadeOut();
      LdsOrg.signin(initLdsOrg);
    }
  }, 'text');
}());
