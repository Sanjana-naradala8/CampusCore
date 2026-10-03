/* ===== CITS main.js ===== */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var IMG = 'assets/images/';

  /* ---------- Theme (dark / light) ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('cits_theme'); } catch (e) {}
  var theme = saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyTheme(t) {
    theme = t;
    root.setAttribute('data-theme', t);
    var logo = $('.brand img');
    if (logo) logo.src = IMG + (t === 'dark' ? 'logo-header-white.png' : 'logo.png');
    var btn = $('.theme-toggle');
    if (btn) { btn.textContent = t === 'dark' ? '☀️' : '🌙'; btn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode'); }
    try { localStorage.setItem('cits_theme', t); } catch (e) {}
  }

  var wrap = $('.nav-wrap');
  if (wrap) {
    var tbtn = document.createElement('button');
    tbtn.className = 'theme-toggle';
    tbtn.type = 'button';
    tbtn.addEventListener('click', function () { applyTheme(theme === 'dark' ? 'light' : 'dark'); });
    wrap.insertBefore(tbtn, $('.nav-burger'));
  }
  applyTheme(theme);

  /* ---------- Mobile menu: close after link click ---------- */
  $$('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { var c = $('#nav-toggle'); if (c) c.checked = false; });
  });

  /* ---------- Header shadow + back to top ---------- */
  var header = $('.site-header');
  var top = document.createElement('button');
  top.className = 'to-top'; top.type = 'button'; top.textContent = '↑'; top.setAttribute('aria-label', 'Back to top');
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(top);
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    top.classList.toggle('show', y > 400);
  });

  /* ---------- Scroll reveal ---------- */
  var targets = $$('.card, .photo-card, .faculty-card, .step, .split, .section-title');
  targets.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else { targets.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Tabs + search filter (works on any page) ---------- */
  $$('[data-filter-group]').forEach(function (group) {
    var tabs = $$('.tab', group);
    var search = $('.search', group);
    var items = $$('[data-cat]', group);
    var empty = $('.empty', group);
    var current = 'all';
    function run() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      items.forEach(function (it) {
        var okCat = current === 'all' || it.getAttribute('data-cat').split(' ').indexOf(current) > -1;
        var okQ = !q || it.textContent.toLowerCase().indexOf(q) > -1;
        it.classList.toggle('hide', !(okCat && okQ));
        if (okCat && okQ) shown++;
      });
      if (empty) empty.classList.toggle('hide', shown > 0);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active'); current = t.getAttribute('data-filter'); run();
      });
    });
    if (search) search.addEventListener('input', run);
  });

  /* ---------- Accordion ---------- */
  $$('.acc-q').forEach(function (q) {
    q.addEventListener('click', function () { q.parentNode.classList.toggle('open'); });
  });

  /* ---------- Lightbox ---------- */
  var gal = $$('.gallery img');
  if (gal.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button type="button" aria-label="Close">×</button><img alt="">';
    document.body.appendChild(lb);
    gal.forEach(function (im) {
      im.addEventListener('click', function () { $('img', lb).src = im.src; $('img', lb).alt = im.alt; lb.classList.add('open'); });
    });
    lb.addEventListener('click', function () { lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  }

  /* ---------- Popup modal ---------- */
  function showModal(title, message, icon) {
    var m = document.createElement('div');
    m.className = 'modal open';
    m.innerHTML = '<div class="modal-box"><div class="ok">' + (icon || '✓') + '</div><h3>' + title + '</h3><p>' + message + '</p><button type="button" class="btn btn-navy">OK</button></div>';
    document.body.appendChild(m);
    function close() { m.remove(); }
    $('button', m).addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
  }
  window.CITS = { showModal: showModal };

  /* ---------- Forms: validate + save to localStorage ---------- */
  function store(key, obj) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    list.push(obj);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
    return list;
  }
  function setErr(input, msg) {
    var e = input.nextElementSibling;
    if (!e || !e.classList.contains('err')) { e = document.createElement('span'); e.className = 'err'; input.parentNode.insertBefore(e, input.nextSibling); }
    e.textContent = msg || '';
  }
  var rules = {
    name: function (v) { return /^[A-Za-z][A-Za-z .'-]{2,}$/.test(v) ? '' : 'Enter your full name (letters only).'; },
    phone: function (v) { return /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a valid 10-digit mobile number.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Enter a valid email address.'; }
  };

  $$('form[data-form]').forEach(function (form) {
    var type = form.getAttribute('data-form');
    form.setAttribute('novalidate', '');
    $$('input, select, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { if (rules[f.name]) setErr(f, rules[f.name](f.value.trim())); });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true, data = {};
      $$('input, select, textarea', form).forEach(function (f) {
        if (!f.name) return;
        var v = f.value.trim(); data[f.name] = v;
        var msg = '';
        if (rules[f.name]) msg = rules[f.name](v);
        else if (f.hasAttribute('required') && !v) msg = 'This field is required.';
        setErr(f, msg);
        if (msg) ok = false;
      });
      if (!ok) { var bad = $('.err:not(:empty)', form); if (bad) bad.previousElementSibling.focus(); return; }
      data.date = new Date().toLocaleString();
      if (type === 'admission') {
        data.id = 'CITS-2026-' + Math.floor(1000 + Math.random() * 9000);
        data.status = 'Received';
        store('cits_admissions', data);
        showModal('Application Submitted', 'Thank you, ' + data.name + '! Your Application ID is <strong>' + data.id + '</strong>. Keep it safe to check your status.');
      } else {
        store('cits_messages', data);
        showModal('Message Sent', 'Thank you, ' + data.name + '! Our team will contact you soon.');
      }
      form.reset();
    });
  });

  /* ---------- Application status lookup ---------- */
  var sf = $('#status-form');
  if (sf) sf.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var id = $('#appid').value.trim().toUpperCase();
    var list = [];
    try { list = JSON.parse(localStorage.getItem('cits_admissions') || '[]'); } catch (e) {}
    var f = list.filter(function (x) { return x.id === id; })[0];
    if (f) showModal('Application Found', 'Name: <strong>' + f.name + '</strong><br>Branch: ' + (f.branch || '-') + '<br>Status: <strong>' + f.status + '</strong>');
    else showModal('Not Found', 'No application found for ID ' + (id || '(empty)') + '. Please check the ID.', '!');
  });
})();