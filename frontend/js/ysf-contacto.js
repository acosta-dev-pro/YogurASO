/* ysf-contacto.js: sección Contacto del home. Sin dependencias y seguro con defer.
   1) Entrada con IntersectionObserver (solo transform/opacity; nada si hay reduced-motion).
   2) Formulario: valida Nombre y Mensaje (Teléfono opcional) y abre wa.me/<WHATSAPP_NUMBER de js/config.js>
      con el texto ya escrito. No hay envíos simulados: además guarda una copia en Supabase
      (contact_messages) si la tabla existe; si no, solo WhatsApp. */
(function () {
  'use strict';

  function init() {
    var root = document.querySelector('[data-ysc]');
    if (!root || root.getAttribute('data-ysc-ready')) return;
    root.setAttribute('data-ysc-ready', '1');
    reveal(root);
    var form = root.querySelector('[data-ysc-form]');
    if (form) setupForm(form);
  }

  function reveal(root) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var items = root.querySelectorAll('.ysc-rv');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('ysc-on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    root.addEventListener('focusin', function () {
      for (var i = 0; i < items.length; i++) items[i].classList.add('ysc-on');
    });
    root.classList.add('ysc--js');
    for (var i = 0; i < items.length; i++) io.observe(items[i]);
  }

  function setupForm(form) {
    var f = { nombre: form.elements.nombre, telefono: form.elements.telefono, mensaje: form.elements.mensaje };
    var status = form.querySelector('[data-ysc-status]');

    function setError(input, msg) {
      var err = document.getElementById(input.id + '-err');
      if (msg) { input.setAttribute('aria-invalid', 'true'); if (err) { err.textContent = msg; err.hidden = false; } }
      else { input.removeAttribute('aria-invalid'); if (err) { err.textContent = ''; err.hidden = true; } }
    }
    function check(input) {
      var v = input.value.trim();
      if (input === f.nombre) return v.length < 2 ? 'Escribe tu nombre.' : '';
      if (input === f.mensaje) return v.length < 3 ? 'Escribe tu mensaje.' : '';
      if (input === f.telefono) return v && !/^[0-9+()\s-]{7,20}$/.test(v) ? 'Revisa el teléfono: solo números, espacios, + o guiones.' : '';
      return '';
    }
    [f.nombre, f.telefono, f.mensaje].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setError(input, check(input)); });
      input.addEventListener('blur', function () { if (input.value) setError(input, check(input)); });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var first = null;
      [f.nombre, f.telefono, f.mensaje].forEach(function (input) {
        var msg = check(input); setError(input, msg);
        if (msg && !first) first = input;
      });
      if (first) { if (status) status.textContent = 'Revisa los campos marcados.'; first.focus(); return; }

      var cfg = window.YOGUR_CONFIG || {};
      var number = String(cfg.WHATSAPP_NUMBER || '').replace(/\D/g, '');
      if (!number) { if (status) status.textContent = 'No pudimos abrir WhatsApp. Escríbenos al correo de contacto.'; return; }

      var name = cfg.COMPANY_NAME || 'YogurASO';
      var lines = ['Hola ' + name + ', soy ' + f.nombre.value.trim() + '.', '', f.mensaje.value.trim()];
      var tel = f.telefono.value.trim();
      if (tel) lines.push('', 'Teléfono: ' + tel);
      var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'));

      // Sin 'noopener' en features: con él window.open devuelve null siempre y no se podría detectar el bloqueo.
      var win = window.open(url, '_blank');
      if (win) { try { win.opener = null; } catch (e) { /* nada */ } }
      else window.location.href = url;
      if (status) status.textContent = 'Abrimos WhatsApp con tu mensaje. Solo falta enviarlo.';
      saveMessage(f.nombre.value.trim(), tel, f.mensaje.value.trim());
    });
  }

  /* Copia del mensaje en Supabase (tabla contact_messages, solo la lee el admin).
     Va después de abrir WhatsApp y en silencio: si la tabla aún no existe, no pasa nada. */
  function saveMessage(nombre, tel, mensaje) {
    var vid = null;
    try { vid = localStorage.getItem('yog_visitor_id'); } catch (e) { vid = null; }
    if (!vid && window.crypto && crypto.randomUUID) {
      vid = crypto.randomUUID();
      try { localStorage.setItem('yog_visitor_id', vid); } catch (e) { /* nada */ }
    }
    if (!/^[0-9a-f-]{36}$/i.test(String(vid || ''))) return;
    import('./supabase-client.js')
      .then(function (m) {
        return m.obtenerSupabase().from('contact_messages').insert({
          kind: 'contacto',
          visitor_id: vid,
          name: nombre.slice(0, 80),
          phone: tel ? tel.slice(0, 30) : null,
          message: mensaje.slice(0, 1000)
        });
      })
      .then(function (res) { if (res && res.error) console.info('[contacto] no se guardó en la base:', res.error.message); })
      .catch(function (err) { console.info('[contacto] sin Supabase:', err && err.message); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
