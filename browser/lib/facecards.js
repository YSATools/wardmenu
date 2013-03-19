/*
 * BROWSER
 */
(function () {
  "use strict";

  var $ = require('jQuery')
    //, _ = require('underscore')
    , domReady = $
    , request = require('ahr2')
    //, forEachAsync = require('forEachAsync')
    //, serializeForm = require('serialize-form')
    , searchTpl
    , cardStats = {}
    , passingCards = {}
      /*
        failCount: 14
        passCount: 16
      */
    , failingCards = {}
      /*
        failCount: 0
        passCount: 0
      */
    , currentCard
    , DeckP
    , getShuffledDeck
    , getSuggestionsBySearch
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

  
  function takePunishment() {
    var key = currentCard._id
      , stat
      ;

    stat = cardStats[key] = cardStats[key] || { key: key, failCount: 0, passCount: 0, badCount: 0 };
    failingCards[key] = stat;
    passingCards[key] = null;
    stat.badCount += 1;
  }
  function showHint() {
    var hint = $('.js-name-hints').text()
      ;

    // TODO do this data storage in an object, not in the DOM, duh!
    hint = $('.js-name').text().substr(0, hint.length + 1);
    while (' ' === hint[hint.length - 1]) {
      hint = $('.js-name').text().substr(0, hint.length + 1);
    }

    $('.js-name-hints').text(hint);
    $('input#js-search-input').val(hint);
    $('#js-search-input').trigger('keyup');
    
    takePunishment();
    ensureHint();
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

  function youWin() {
    global.alert('all done');
    sizeImage('/images/gold.jpg');
  }

  function loadCard(card) {
    var img
      ;

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
    // workaround for bootstrap clearing the field
    setTimeout(function () {
      var hints = $('.js-name-hints').text().split('')
        , typed = $('input#js-search-input').val().split('')
        ;

      hints.forEach(function (char, i) {
        typed[i] = char;
      });

      console.log('force hint', typed);
      $('input#js-search-input').val(typed.join(''));
    }, 4);
  }

  function nextCard() {
    var stat
      , key
      ;

    if (currentCard) {
      key = currentCard._id;
      stat = cardStats[key] = cardStats[key] || { key: key, failCount: 0, passCount: 0, badCount: 0 };
      if (stat.badCount) {
        stat.failCount += 1;
        stat.badCount = 0;
      }
      stat.passCount += 1;
      if (stat.passCount > stat.failCount) {
        failingCards[key] = null;
        passingCards[key] = stat;
      }
    }

    getShuffledDeck(function (fullCards) {
      var needAnother = true
        , fullCard
        , alreadyPassed = Object.keys(passingCards)
        ;

      // don't let currentCard be the very next card
      while (needAnother) {
        fullCard = fullCards.pop();
        if (!fullCard) {
          // TODO reload with most-guesses-required first
          youWin();
          return;
        }
        // Find a card that hasn't already passed
        if (-1 === alreadyPassed.indexOf(fullCard._id)) {
          needAnother = false;
        }
      }

      currentCard = fullCard;
      loadCard(currentCard);
    });
  }

  function guessAndCheck(guess) {
    var fact
      ;

    // TODO use uid to index into deck
    guess = guess || '';
    fact = $('#js-card-container .js-name').text();

    if (fact.toLowerCase().trim() === guess.toLowerCase().trim()) {
      nextCard();
    } else {
      showHint();
    }
  }

  function init() {
    searchTpl = $('#js-results-container').html();
    $('body').delegate('form#js-search', 'submit', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      guessAndCheck();
    });
    $('body').delegate('input#js-search-input', 'keyup', function () {
      ensureHint();
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

      ensureHint();
    });
    $('body').delegate('button.js-hint', 'click', showHint);

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
  Facecards.prototype.init = function (handlers) {
    getShuffledDeck = handlers.shuffle;
    getSuggestionsBySearch = handlers.search;

    domReady(function () {
      //$('.js-typeahead').typeahead({
      $('#js-search-input').typeahead({
          source: function (query, process) {
            getSuggestionsBySearch(process);
            //process(['aa', 'ab', 'ac', 'bd']);
          }
        , items: 10
        , minLength: 1
        , updater: guessAndCheck
      });
      /*
      $('.typeahead').typeahead({
          source: getSuggestionsBySearch
        , 
      });
      */
      getShuffledDeck(function (cards) {
        console.log('[FC] init', cards);

        init();
        nextCard();
      });
    });
  };

  module.exports = {
    create: function () {
      return Object.create(Facecards.prototype);
    }
  };
}());
