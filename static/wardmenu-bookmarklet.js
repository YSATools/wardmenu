(function () {
  if (!document.getElementById("js-wardmenu-script-on") && !document.getElementById("js-wardmenu-script")) {
    var wardmenuJs = document.createElement("script");
    /* TODO put on thewardmenu.com with https */
    /* wardmenuJs.src = "http://thewardmenu.com/wardmenu-app.js"; */
    wardmenuJs.src = "https://raw.github.com/coolaj86/wardmenu/master/static/wardmenu-app.js";
    wardmenuJs.id = "js-wardmenu-script";
    document.body.appendChild(wardmenuJs);
    /* We know that jQuery exists on the site already */
    $.ajax({
        url: "http://thewardmenu.com/wardmenu-app.js"
      , type: "GET"
      , dataType: 'text'
      , success: function (jsText) {
          $('<script></script>').html(jsText).appendTo('body');
        }
      , error: function () {
          alert('Looks like your bookmarklet is out of date. Go back to thewardmenu.com to get a new one');
          location.href = 'http://thewardmenu.com';
        }
    });
  }
})();
