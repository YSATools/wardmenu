(function () {
  "use strict";

  var request = require('ahr2')
    , Facecards = require('facecards/facecards')
    ;

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
        if ('#mock.json' !== location.hash) {
          location.hash = '';
          getDeck(cb, search);
        }
        return;
      }

      cb(data);
    });
  }

  getDeck(function (cards) {
    var fc = Facecards.create()
      ;

    fc.init(cards);
  });
}());
