/** Bookmark-safe redirects to the purchaser download portal. */
(function () {
  var portal = '/createyourfoodplan/';
  if (location.pathname.replace(/\/$/, '') !== portal.replace(/\/$/, '')) {
    location.replace(portal);
  }
})();
