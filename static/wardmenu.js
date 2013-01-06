/*jshint strict:true jquery:true browser:true es5:true onevar:true laxcomma:true scripturl:true
laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true*/
(function () {
  "use strict";

  $(function () {
    $.get('/wardmenu-bookmarklet.js', function (data) {
      $('.js-bookmarklet').each(function (i, el) {
        $(el).attr('href', 'javascript:' + data.replace(/LOCATION_HOST/g, location.host));
      });
    }, 'text');
  });
}());
