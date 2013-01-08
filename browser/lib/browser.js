/*jshint strict:true jquery:true browser:true node:true es5:true scripturl:true
onevar:true laxcomma:true laxbreak:true unused:true undef:true latedef:true*/
/*
 * BROWSER
 */
(function () {
  "use strict";

  var $ = jQuery
    , domReady = function (fn) {
        // don't allow jQuery to swallow all the stack traces!!!
        $(function () {
          setTimeout(fn, 0);
        });
      }
    //, _ = require('underscore')
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

  function updateCounter() {
    $('.js-member-counter').text(1 + (Number($('.js-member-counter').text()) || 0));
  }
  function updateMemberTotal(memberList) {
    $('.js-member-total').text(memberList.length + (Number($('.js-member-total').text()) || 0));
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

      // TODO events
      /*
      ldsDir.init({
          'stake': function (stake) {
            console.log('stake has ' + stake.wards.length + ' wards');
          }
        , 'ward': function (ward) {
            console.log('stake z, downolading ward x of y, ' + ward..length + ' households');
          }
        , 'profile': function (profile) {
            console.log('stake z, ward x, household y of q, ' + ward.length + ' households');
            // TODO ward + household + photo
          }
      });
      */

      cards = profiles.map(function (p) {
        var names = p.headOfHousehold.name.split(',')
          , last = names.shift().trim()
          , name = names.join(', ').trim() + ' ' + last
          ;

        return {
            name: name
          , thumbnail: p.householdInfo.photoUrl || p.headOfHousehold.photoUrl
              //p.photoUrl
          // TODO gender
          //, "imageData": h.imageData // added by download
        };
      });

      $('#js-facecards-container').show();
      $('#js-wm-loading').hide();
      fc.init(cards);
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
      if (!card.photoUrl) {
        next();
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

        card.imageData = c.toDataURL('image/jpeg', 0.4);
        next();
      };

      img.onerror = function(){
        next();
      };

      img.src = card.photoUrl;
    }
      profile.photoUrl = profile.householdInfo.photoUrl || profile.headOfHousehold.photoUrl;
      getPic(onResult, profile);
*/

    uploadWardDeck();
  }
}());
