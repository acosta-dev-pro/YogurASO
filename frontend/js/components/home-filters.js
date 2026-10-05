/* home-filters.js — filtros Todos/Frutales/Clásicos/Especiales en home v3 */
(function () {
  var grid = document.getElementById('v3-flavor-grid');
  var filters = document.querySelector('.v3-filters');
  if (!grid || !filters) return;

  var map = {
    all: null,
    frutales: ['fresa', 'pina', 'mora', 'melocoton', 'mango', 'frutos-rojos'],
    clasicos: ['fresa', 'pina', 'mora', 'melocoton'],
    especiales: ['cafe', 'guanabana']
  };

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    filters.querySelectorAll('.v3-filter').forEach(function (b) {
      b.classList.toggle('is-on', b === btn);
    });
    var key = btn.getAttribute('data-filter');
    var allowed = map[key];
    grid.querySelectorAll('.v3-flavor-card').forEach(function (card) {
      var slug = card.getAttribute('data-ficha') || '';
      var show = !allowed || allowed.indexOf(slug) >= 0;
      var li = card.closest('li') || card;
      li.style.display = show ? '' : 'none';
    });
  });

  // Abrir ficha al click si existe YogFicha (sin navegar)
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-ficha]');
    if (!card || !window.YogFicha) return;
    e.preventDefault();
    window.YogFicha.open(card.getAttribute('data-ficha'), card);
  });
})();
