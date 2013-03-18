(function () {
  "use strict";

  // Poor Man's forEachAsync
  function forEachAsync(arr, fn) {
    var gfn
      , index = -1
      ;

    function next() {
      if (0 === arr.length) {
        gfn();
        return;
      }

      index += 1;
      fn(next, arr.shift(), index, arr);
    }

    setTimeout(next, 4);

    return {
      then: function (_fn) {
        gfn = _fn;
      }
    };
  }

  module.exports = forEachAsync;
}());
