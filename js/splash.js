/* Splash de abertura — mesma lógica do site do evento ([PG]ExpoCommerce/js/app.js):
   versão completa (3,5s) na primeira visita da aba; recarregar a página na
   mesma sessão mostra só um relance (0,9s), igual quem pede menos movimento. */
(function () {
  'use strict';
  var splash = document.getElementById('splash');
  if (!splash) return;

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var jaMostrou = false;
  try {
    jaMostrou = sessionStorage.getItem('card_splash_visto') === '1';
    sessionStorage.setItem('card_splash_visto', '1');
  } catch (e) { /* Safari privado pode negar — splash só repete, sem quebrar nada */ }

  var duracao = reduzMovimento || jaMostrou ? 900 : 3500;
  setTimeout(function () {
    splash.classList.add('is-saindo');
    document.body.classList.remove('tem-splash');
    splash.addEventListener('transitionend', function () { splash.remove(); }, { once: true });
    // garantia: se o transitionend não disparar (aba em segundo plano), remove assim mesmo
    setTimeout(function () { if (splash.parentNode) splash.remove(); }, 1500);
  }, duracao);
})();
