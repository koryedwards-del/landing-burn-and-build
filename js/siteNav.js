/** Shared mobile nav toggle for Burn & Build marketing + legal pages. */
(function () {
  var ham = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  if (!ham || !mobileNav) return;
  ham.addEventListener('click', function () {
    mobileNav.classList.toggle('open');
  });
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
    });
  });
})();
