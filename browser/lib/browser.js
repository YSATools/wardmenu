/*jshint strict:true jquery:true browser:true node:true es5:true scripturl:true
onevar:true laxcomma:true laxbreak:true unused:true undef:true latedef:true*/
/*
 * BROWSER
 */
(function () {
  "use strict";

  var App = module.exports
    , $ = jQuery
    , domReady = function (fn) {
        // don't allow jQuery to swallow all the stack traces!!!
        $(function () {
          setTimeout(fn, 0);
        });
      }
    //, _ = require('underscore')
    , forEachAsync = require('forEachAsync')
    , location = require('location')
    , LdsOrg = require('./ldsorg')
    , Facecards = require('./facecards')
    , request = require('ahr2')
    ;

  function initWardMenuNative() {
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

  function getImageData(next, card, imgSrc) {
    if (!imgSrc) {
      next(new Error('no imgSrc'));
      return;
    }

    var img
      ;

    img = document.createElement('img');
    img.onload = function () {
      var c = document.createElement('canvas')
        , c2d = c.getContext('2d')
        ;

      c.height = this.height,
      c.width = this.width;
      c2d.drawImage(this, 0,0);

      next(null, c.toDataURL('image/jpeg'));
    };

    img.onerror = function(){
      next(new Error("Didn't load image"));
    };

    img.src = imgSrc;
  }


  function initLdsOrg() {
    var ldsOrg
      ;

    domReady(function () {
      $('#js-facecards-container').hide();
    });
    ldsOrg = LdsOrg.create();
    ldsOrg.init({
        profile: updateCounter
      , memberList: updateMemberTotal
    });

    ldsOrg.getCurrentWardProfiles(function (profiles) {
      var fc = Facecards.create()
        , cards
        //, emails = []
        ;

      App.fullMemberList = profiles;
      cards = profiles.map(function (p) {
        var names = p.headOfHousehold.name.split(',')
          , last = names.shift().trim()
          , name = names.join(', ').trim() + ' ' + last
          , photoUrl = p.householdInfo.photoUrl || p.headOfHousehold.photoUrl
            // TODO gender
            //, "imageData": h.imageData // added by download
          , card = { name: name, thumbnail: photoUrl }
          ;

        return card;
      });
      resetCounter();
      forEachAsync(cards, function (next, card) {
        // caching for the future
        getImageData(function (err, imageData) {
          updateCounter();
          //card.imageData = c.toDataURL('image/jpeg', 0.4);
          card.imageData = imageData;
          console.log('updated for', !!card.imageData);
          next();
        }, card, card.thumbnail);
      }).then(function () {
        App.cards = cards;

        $('#js-facecards-container').show();
        $('#js-wm-loading').hide();
        fc.init(cards);
      });
    });
  }

  if (!/\blds.org\b/.test(location.host)) {
    initWardMenuNative();
    return;
  } else {
    initLdsOrg();
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
