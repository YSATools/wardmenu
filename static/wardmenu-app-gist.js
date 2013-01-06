/*jshint strict:true browser:true jquery:true es5:true
onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true*/
(function () {
  "use strict";

  //$('<link rel="stylesheet" type="text/css" href="http://thewardmenu.com/widget.css" media="screen" />')
  $('<link rel="stylesheet" type="text/css" href="https://gist.github.com/raw/281972c6db467628e776/wardmenu-app.css" media="screen" />')
    .appendTo('head');
  if (!$('#js-wm-root').length) {
    $('body').append('<div id="js-wm-root"></div>');
  }
  $('#js-wm-root').load("http://thewardmenu.com/widget.html");
}());
