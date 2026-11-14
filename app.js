(function () {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- breakdown demo ---- */
  var demo = document.getElementById('demo');
  var cats = Array.prototype.slice.call(demo.querySelectorAll('.cat'));
  var order = ['cast', 'bg', 'props', 'set'];
  var on = {};
  var timers = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    var list = order.filter(function (k) { return on[k]; });
    demo.setAttribute('data-on', list.join(' '));
    cats.forEach(function (b) { b.setAttribute('aria-pressed', on[b.dataset.cat] ? 'true' : 'false'); });
  }
  function clear() { timers.forEach(clearTimeout); timers = []; }

  cats.forEach(function (b) {
    b.addEventListener('click', function () {
      clear();
      on[b.dataset.cat] = !on[b.dataset.cat];
      render();
    });
  });

  function runPass() {
    clear();
    order.forEach(function (k) { on[k] = false; });
    render();
    order.forEach(function (k, i) {
      var t = setTimeout(function () { on[k] = true; render(); }, reduce ? 0 : 450 * (i + 1));
      timers.push(t);
    });
  }
  document.getElementById('run').addEventListener('click', runPass);

  // The pass runs once as the demo scrolls into view.
  var ran = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting && !ran) { ran = true; runPass(); obs.disconnect(); }
    }, { threshold: 0.6 }).observe(demo);
  } else { runPass(); }

  /* ---- screen viewer ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var shot = document.getElementById('shot');
  var img = shot.querySelector('img');
  var cap = shot.querySelector('figcaption');

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.tabIndex = sel ? 0 : -1;
    });
    shot.setAttribute('aria-labelledby', tab.id);
    img.classList.add('swap');
    setTimeout(function () {
      img.src = tab.dataset.src;
      img.alt = 'Slate screen: ' + tab.textContent + '.';
      cap.textContent = tab.dataset.cap;
      img.onload = function () { img.classList.remove('swap'); };
      if (img.complete) img.classList.remove('swap');
    }, reduce ? 0 : 120);
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });

  /* ---- page-edge rail: mark the page in view ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.rail a'));
  var map = {};
  links.forEach(function (a) { map[a.dataset.page] = a; });
  function mark(id) {
    links.forEach(function (a) { a.removeAttribute('aria-current'); });
    if (map[id]) map[id].setAttribute('aria-current', 'true');
  }
  mark('p-white');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.page').forEach(function (p) { io.observe(p); });
  }

  /* ---- notify: collected by Web3Forms (https://web3forms.com) ----
     Paste your access key below. It is public by design and safe in client code.
     While it is empty, the form falls back to opening the visitor's email app. */
  var WEB3FORMS_KEY = '83519e56-8fbb-43cb-83e4-b8ebf3f1ac38';
  var TO = 'guerrillaframe@gmail.com';

  function fallbackMailto(v, msg) {
    var subject = encodeURIComponent('Notify me when Slate launches');
    var body = encodeURIComponent('Please let me know when Slate launches.\n\nMy email: ' + v);
    msg.textContent = 'Opening your email app. If nothing opens, write to ' + TO + '.';
    window.location.href = 'mailto:' + TO + '?subject=' + subject + '&body=' + body;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-notify]'), function (form) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.msg');
    var busy = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        msg.textContent = 'That doesn’t look like an email address. Check it and try again.';
        input.focus();
        return;
      }
      // Honeypot: real visitors never fill this hidden field.
      var trap = form.querySelector('input[name="botcheck"]');
      if (trap && trap.checked) return;

      if (!WEB3FORMS_KEY) { fallbackMailto(v, msg); return; }

      busy = true;
      button.disabled = true;
      msg.textContent = 'Adding you…';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Slate launch notification signup',
          from_name: 'Slate landing page',
          email: v,
          message: 'Please notify this address when Slate launches.'
        })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.success) {
          form.reset();
          msg.textContent = 'You’re on the list. We’ll email you the day Slate launches.';
        } else {
          throw new Error((d && d.message) || 'failed');
        }
      }).catch(function () {
        msg.textContent = 'That didn’t go through. Email ' + TO + ' and we’ll add you by hand.';
      }).then(function () { busy = false; button.disabled = false; });
    });
  });
})();
