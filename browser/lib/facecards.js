/*jshint strict:true jquery:true browser:true node:true es5:true scripturl:true eqeqeq:true immed:true
onevar:true laxcomma:true laxbreak:true unused:true undef:true latedef:true*/
/*
 * BROWSER
 */
(function () {
  "use strict";

  var $ = jQuery
    //, _ = require('underscore')
    , domReady = function (fn) {
        // don't allow jQuery to swallow all the stack traces!!!
        $(function () {
          setTimeout(fn, 0);
        });
      }
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

    function getValue(item) {
      var val = 0
        ;

      // First name begins with
      if (new RegExp('^' + input, 'i').test(item)) {
        val += 1;
      }

      // Any name begins with
      if (new RegExp('\\b' + input, 'i').test(item)) {
        val += 1;
      }

      // Caps match exactly i.e. McBride
      if (new RegExp(input).test(item)) {
        val += 1;
      }

      return val;
    }

    result = cache.filter(function (item) {
      return new RegExp(input, 'i').test(item.name);
    }).sort(function (a, b) {
      return getValue(b.name) - getValue(a.name);
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

  function doRender(obj) {
    var searchDirective = {
      ".js-result-item": {
        "o <-": {
            ".js-name": "o.name"
          //, ".js-thumbnail@src": "o.thumbnail"
        }
      }
    };

    $('#js-results-container').html(searchTpl);
    pure('#js-results-container').render(obj, searchDirective);
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

    $('#js-card-container .js-thumbnail img').remove();
    img = new global.Image();
    img.src = src;
    // TODO center profile pics like facebook does
    // https://gist.github.com/3720379
    /*
    $(img).load(function () {
      // TODO move to stylesheet class duh
      img.style.position = 'absolute';
      img.width = 200;
      img.removeAttribute('height');
      //left: 50%; margin-left: -50%;
      img.style.left = '50%';
      img.style.marginLeft = '-50%';
      if (img.height < 200) {
        img.height = 200;
        img.removeAttribute('width');
      }
      // TODO center extra wide fotos
      img.style.marginLeft = '-' + (img.width / 2) + 'px';
    });
    */
    $('#js-card-container .js-thumbnail').prepend(img);

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
      $('#js-facecards-container ul li:first').click();
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
        doRender([]);
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

  }

  function Facecards() {
  }
  Facecards.prototype.init = function (_cards) {
    domReady(function () {
      cards = _cards;

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

      init();
      nextCard();
      searchAgain();
    });
  };

  module.exports = {
    create: function () {
      return Object.create(Facecards.prototype);
    }
  };
}());
