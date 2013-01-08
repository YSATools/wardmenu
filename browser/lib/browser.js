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
    , pure = require('pure').$p
    , request = require('ahr2')
    //, forEachAsync = require('forEachAsync')
    //, serializeForm = require('serialize-form')
    , searchTimeout = null
    , ajasMutex = false
    , searchWaiting = false
    , prevVal = ''
    , searchTpl
    , cards = []
    , currentCard
    , DeckP
    , cache
    ;

  function Deck(cards) {
    if (!(this instanceof Deck)) {
      return new Deck(cards);
    }
    this.cards = cards;
  }
  DeckP = Deck.prototype;
  DeckP.draw = function (/*n*/) {
  };
  DeckP.shuffle = function () {
  };
  DeckP.discard = function () {
  };
  DeckP.take = function () {
  };
  Deck.create = function (cards) {
    return new Deck(cards);
  };

  
  function searchDeckCache(cb) {
    var input = $('#js-search-input').val().replace(/\s+/g, ' ').replace(/\s$/, '')
      , result
      ;

    result = cache.filter(function (item) {
      return new RegExp(input, 'i').test(item.name);
    });

    cb(result);
    console.log('search results:', result);
  }

  function searchAgainNow() {
    var input = $('#js-search-input').val().replace(/\s+/g, ' ').replace(/\s$/, '')
      ;

    /*
    if (!input) {
      doRender([]);
      // TODO clear results?
      return;
    }
    */

    // don't send when simply using the arrow keys
    // or deleting the text in the field
    if (input === prevVal) {
      return;
    }

    prevVal = input;
    clearTimeout(searchTimeout);
    searchDeckCache(doRender);
    if (ajasMutex) {
      searchWaiting = true;
      return;
    }

    // TODO show current query to user
    console.log(input, typeof input);
    searchDeckCache(doRender, input);
  }

  function doRender(object) {
    var searchDirective = {
      ".js-result-item": {
        "o <-": {
            ".js-name": "o.name"
          //, ".js-thumbnail@src": "o.thumbnail"
        }
      }
    };

    $('#js-results-container').html(searchTpl);
    pure('#js-results-container').render(object, searchDirective);
  }

  function searchAgain() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchAgainNow, 400);
    searchDeckCache(doRender);
  }

  function showHint() {
    // TODO use data attribute
    var hintLen = $('#js-card-container .js-name-hints').text().length
      , fullLen = $('#js-card-container .js-name').text().length
      ;

    if (fullLen === hintLen) {
      global.alert('You already have the full answer. Seriously, quit trying to get a hint!');
      return;
    }
  }

  function sizeImage(src) {
    var img
      ;

    $('#js-card-container .js-thumbnail').html('');
    img = new global.Image();
    img.src = src;
    $(img).load(function () {
      // TODO move to stylesheet class duh
      img.style.position = 'absolute';
      img.width = 200;
      img.removeAttribute('height');
      //left: 50%; margin-left: -50%;
      img.style.left = '50%';
      img.style.marginLeft = '-50%';
      /*
      */
      if (img.height < 200) {
        img.height = 200;
        img.removeAttribute('width');
      }
      // TODO center extra wide fotos
      img.style.marginLeft = '-' + (img.width / 2) + 'px';
      //*/
    });
    $('#js-card-container .js-thumbnail').append(img);

    return img;
  }

  function loadCard(card) {
    var img
      ;

    // TODO reload with most-guesses-required first
    if (!card) {
      global.alert('all done');
      sizeImage('/images/gold.jpg');
    }
    $('#js-search-input').val('');
    $('#js-card-container .js-name-hints').text('');
    $('#js-card-container .js-name').text(card.name);
    if (card.imageData) {
      img = sizeImage(card.imageData);
    } else {
      img = sizeImage(card.thumbnail);
    }
  }

  function ensureHint() {
    var hints = $('.js-name-hints').text().split('')
      , typed = $('input#js-search-input').val().split('')
      ;

    hints.forEach(function (char, i) {
      typed[i] = char;
    });

    $('input#js-search-input').val(typed.join(''));
  }

  function nextCard() {
    if (currentCard) {
      if (currentCard.badCount) {
        // TODO put the bad answer closer to the top of the deck
        cards.splice(cards.length - 1, 0, currentCard);
        currentCard.badCount = 0;
      }
    }

    // 
    currentCard = cards.pop();
    loadCard(currentCard);
  }


  function init() {
    searchTpl = $('#js-results-container').html();
    $('body').delegate('form#js-search', 'submit', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      $('ul li:first').click();
      //searchAgainNow.call(this);
    });
    $('body').delegate('input#js-search-input', 'keyup', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ensureHint();
      searchAgain.call(this);
    });
    $('body').delegate('input#js-search-input', 'keydown', function (ev) {
      // TODO
      // instead of all this goofy logic it would probably be better
      // to use an input-styled box with a box that has characters
      // next to an unstyled input [[Ha][nna]]
      var typed = $('input#js-search-input').val()
        , hint = $('.js-name-hints').text()
        ;

      // prevent normal delete function
      if (8 === ev.which) {
        if (typed.length === hint.length) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      }

      //ensureHint();
    });
    $('body').delegate('button.js-hint', 'click', function () {
      var hint = $('.js-name-hints').text()
        ;

      // do this data storage in an object, not in the DOM, duh!
      console.log('hit the button', hint);

      hint = $('.js-name').text().substr(0, hint.length + 1);
      while (' ' === hint[hint.length - 1]) {
        hint = $('.js-name').text().substr(0, hint.length + 1);
      }

      console.log('hit the button 2', hint, $('.js-name-hints').text());

      $('.js-name-hints').text(hint);

      console.log('hit the button 3', $('.js-name-hints').text());
      $('input#js-search-input').val(hint);
      
      searchDeckCache(doRender);
    });
    $('body').delegate('.js-result-item', 'click', function () {
      var guess
        , fact
        ;

      // TODO use uid to index into deck
      /*jshint validthis:true*/
      guess = $(this).text();
      fact = $('#js-card-container .js-name').text();

      if (fact === guess) {
        global.alert('Good Jorb!');
        nextCard();
      } else {
        global.alert('Bad Jorb!');
        $('#js-search-input').val('');
        currentCard.badCount = currentCard.badCount || 0;
        currentCard.badCount += 1;
      }
    });

    $('body').delegate('div#js-updrop form', 'submit', function (ev) {
      var f = new global.FormData()
        , files
        , i
        ;

      ev.preventDefault();
      ev.stopPropagation();

      files = $('#js-updrop input[type="file"]')[0].files;
      console.log(files);

      for (i = 0; i < files.length; i += 1) {
        f.append('file', files[0]);
      }

      request.post('/upload', null, f);
    });

    //request.get("/meta").when(function (err, ahr, data)
    function getDeck(cb, search) {
      if (!location.hash.substr(1)) {
        location.hash = '#mock.json';
      }

      request.get("/decks/" + location.hash.substr(1)).when(function (err, ahr, data) {
      //request.get("/meta?search=" + encodeURIComponent(search)).when(function (err, ahr, data)
        if (err || !Array.isArray(data)) {
          console.error(data && data.errors || data || "unsuccessful ajas");
          window.alert("Sometimes bad things happen to good people... This is one of those times. :'(");
          window.alert("Couldn't find a card deck by that name");
          location.hash = '';
          getDeck(cb, search);
          return;
        }

        ajasMutex = false;

        cards = data;

        cache = JSON.parse(JSON.stringify(cards));
        cache.sort(function (a, b) {
          return a.name > b.name;
        });

        cards = JSON.parse(JSON.stringify(cards));
        cards = cards.sort(function () {
          return (Math.round(Math.random()) - 0.5);
        }).filter(function (c) {
          if (c.imageData || c.thumbnail) {
            return true;
          }
        });

        cb();
      });
    }

    getDeck(function () {
      nextCard();
      searchAgain();
    });
  }

  function initWardMenuNative() {
    domReady(function () {
      request.get('/bookmarklet.min.js').when(function (err, ahr, data) {
        data = 'javascript:' + data.replace(/LOCATION_HOST/g, location.host);
        $('#js-bookmarklet').attr('href', data);
      });
    });
    domReady(init);
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
