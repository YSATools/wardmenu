/*jshint strict:true browser:true jquery:true es5:true
onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true*/
(function () {
  "use strict";

  // TODO this is just a holdover while developing because a gist is easier to update

  if ($('#js-wardmenu-script-gist').length) {
    return;
  }

  var wardmenuJs = document.createElement("script")
    ;

  /* TODO put on thewardmenu.com with https */
  /* wardmenuJs.src = "http://thewardmenu.com/wardmenu-app.js"; */
  /* wardmenuJs.src = "https://raw.github.com/coolaj86/wardmenu/master/static/wardmenu-app.js"; */
  wardmenuJs.src = "https://gist.github.com/raw/281972c6db467628e776/wardmenu-app.js";
  wardmenuJs.id = "js-wardmenu-script-gist";
  document.body.appendChild(wardmenuJs);
}());
