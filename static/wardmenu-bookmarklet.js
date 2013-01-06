(function () {
  if (!document.getElementById("js-wardmenu-script-on") && !document.getElementById("js-wardmenu-script")) {
    var wardmenuJs = document.createElement("script");
    /* TODO put on thewardmenu.com with https */
    /* wardmenuJs.src = "http://thewardmenu.com/wardmenu-app.js"; */
    wardmenuJs.src = "https://gist.github.com/raw/281972c6db467628e776/wardmenu-app.js";
    wardmenuJs.id = "js-wardmenu-script";
    document.body.appendChild(wardmenuJs);
  }
})();
