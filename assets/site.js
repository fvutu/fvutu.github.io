/* ============================================================
   In Writing Mode — shared behavior for every page
   Nav dropdown · dark nav on scroll · case study outline ·
   click to enlarge · dark-section reveals
   ============================================================ */
(function(){
  var body = document.body;
  var pageId = body.getAttribute('data-page');
  var isCase = body.hasAttribute('data-case');
  var nav = document.getElementById('site-nav');

  /* carousel arrows and click-to-enlarge are labels for hidden inputs;
     switch them without letting the browser jump to the input */
  document.addEventListener('click', function(e){
    var lab = e.target.closest('label[for]');
    if (!lab) return;
    var input = document.getElementById(lab.htmlFor);
    if (input && (input.type === 'radio' || input.type === 'checkbox')) {
      e.preventDefault();
      input.checked = input.type === 'radio' ? true : !input.checked;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* ---------- Work dropdown ---------- */
  var navWork = document.getElementById('nav-work');
  var caret = navWork && navWork.querySelector('.nav-caret');
  function closeMenu(){ if (!navWork) return; navWork.classList.remove('is-open'); caret.setAttribute('aria-expanded', 'false'); }
  if (caret) {
    caret.addEventListener('click', function(e){
      e.stopPropagation();
      var open = !navWork.classList.contains('is-open');
      navWork.classList.toggle('is-open', open); caret.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function(e){ if (!navWork.contains(e.target)) closeMenu(); });
  }

  /* ---------- click to enlarge ----------
     lift each overlay out to <body> so it always covers the screen
     (inside an animated section a "fixed" overlay would be pinned to that section) */
  var lightboxes = [];
  document.querySelectorAll('input[type="checkbox"].skz-r').forEach(function(input){
    var ov = input.parentElement.querySelector('.skz-ov');
    if (!ov) return;
    body.appendChild(ov);
    lightboxes.push({ input: input, ov: ov });
    input.addEventListener('change', syncLightboxes);
  });
  function syncLightboxes(){
    var any = false;
    lightboxes.forEach(function(l){ l.ov.classList.toggle('is-open', l.input.checked); if (l.input.checked) any = true; });
    document.documentElement.classList.toggle('lb-open', any);
  }

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    closeMenu();
    lightboxes.forEach(function(l){ l.input.checked = false; }); syncLightboxes();
  });

  /* ---------- case study outline + back to top ---------- */
  var outline = document.getElementById('outline');
  if (outline && isCase) {
    var olist = document.getElementById('outline-list');
    var otoggle = document.getElementById('outline-toggle');
    var toTop = document.getElementById('to-top');
    var heads = [];
    var collapsed = true;
    var setCollapsed = function(c){ collapsed = c; outline.classList.toggle('is-collapsed', c); otoggle.setAttribute('aria-expanded', String(!c)); };
    otoggle.addEventListener('click', function(){ setCollapsed(!collapsed); });
    toTop.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // copy a heading's text for the outline, keeping only its bold and italic
    var richCopy = function(node){
      var frag = document.createDocumentFragment();
      node.childNodes.forEach(function(n){
        if (n.nodeType === 3) { frag.appendChild(document.createTextNode(n.textContent)); return; }
        if (n.nodeType !== 1) return;
        var st = n.style || {}, tag = n.tagName;
        var bold = tag === 'B' || tag === 'STRONG' || parseInt(st.fontWeight, 10) >= 600;
        var ital = tag === 'I' || tag === 'EM' || st.fontStyle === 'italic';
        var out = richCopy(n);
        if (ital) { var i = document.createElement('i'); i.appendChild(out); out = i; }
        if (bold) { var b = document.createElement('b'); b.appendChild(out); out = b; }
        frag.appendChild(out);
      });
      return frag;
    };

    // section ids keep the old "<slug>-section-N" scheme, so old deep links still land
    document.querySelectorAll('main h2').forEach(function(h, i){
      if (h.closest('footer')) return;
      if (!/48px/.test(h.getAttribute('style') || '')) return;   // section titles only
      if (!h.id) h.id = pageId + '-section-' + (i + 1);
      h.setAttribute('data-outline', '');
      heads.push(h);
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + h.id; a.appendChild(richCopy(h)); a.dataset.target = h.id;
      li.appendChild(a); olist.appendChild(li);
    });
    outline.hidden = heads.length === 0;
    setCollapsed(true);

    olist.addEventListener('click', function(e){
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.target).scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', '#' + a.dataset.target);
    });
    var updateOutline = function(){
      toTop.classList.toggle('is-visible', window.scrollY > 600);
      var line = window.innerHeight * 0.3, cur = null;
      heads.forEach(function(h){ if (h.getBoundingClientRect().top <= line) cur = h; });
      olist.querySelectorAll('a').forEach(function(a){
        var on = cur && a.dataset.target === cur.id;
        a.classList.toggle('is-active', !!on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', updateOutline, { passive: true });
    updateOutline();

    // the section ids are created here, so honor a deep link once they exist
    if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
  }

  /* ---------- nav turns dark while scrolling ---------- */
  function onScroll(){ nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- black sections: links hover red; in case studies they ease in once ---------- */
  function isDark(el){ return /background(-color)?:\s*#141210/i.test(el.getAttribute('style') || ''); }
  var sections = document.querySelectorAll('main section');
  sections.forEach(function(sec){ if (isDark(sec)) sec.classList.add('dark'); });
  if (isCase && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    sections.forEach(function(sec){ if (isDark(sec)) { sec.classList.add('reveal'); io.observe(sec); } });
  }
})();
