/*jshint strict:true browser:true jquery:true es5:true
onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true*/
(function () {
  "use strict";

  // Neither of these work due to security restrictions
  // $('<link rel="stylesheet" type="text/css" href="http://thewardmenu.com/widget.css" media="screen" />')
  // $('<link rel="stylesheet" type="text/css" href="https://gist.github.com/raw/281972c6db467628e776/wardmenu-app.css" media="screen" />').appendTo('head');

  if (!/\blds.org\b/.test(location.host)) {
    window.alert('You are not on LDS.org. Please login to LDS.org and then load WardMenu.');
    return;
  }

  // This does work, however
  $.get('http://thewardmenu.com/widget.css', function (cssText) {
    $('<style>' + cssText + '</style>').appendTo('head').html(cssText);
  }, 'text');
  
  if (!$('#js-wm-root').length) {
    $('body').append('<div id="js-wm-root"></div>');
  }
  
  $('#js-wm-root').load("http://thewardmenu.com/widget.html");

  $.get('http://thewardmenu.com/pakmanaged.js', function (jsText) {
    console.log('got more script (but not)');
    //$('<script>' + jsText + '</script>').appendTo('head');
  }, 'text');
}());
