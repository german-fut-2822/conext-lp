document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Language toggle (ES / EN)
  var LANG_KEY = 'conext-lang';
  var dict = window.CONEXT_I18N || {};
  var langToggle = document.getElementById('langToggle');
  var originalTitle = document.title;

  var applyLang = function (lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = dict[el.getAttribute('data-i18n')];
      if (entry && entry[lang] != null) el.innerHTML = entry[lang];
    });
    document.querySelectorAll('[data-i18n-es]').forEach(function (el) {
      var value = lang === 'en' ? el.getAttribute('data-i18n-en') : el.getAttribute('data-i18n-es');
      if (value != null) el.innerHTML = value;
    });
    var titleEntry = dict[document.body.getAttribute('data-i18n-title')];
    if (titleEntry) document.title = lang === 'en' && titleEntry.en ? titleEntry.en : originalTitle;
    document.documentElement.lang = lang === 'en' ? 'en' : 'es-MX';
    if (langToggle) {
      langToggle.querySelectorAll('[data-lang-opt]').forEach(function (opt) {
        opt.classList.toggle('active', opt.getAttribute('data-lang-opt') === lang);
      });
    }
    localStorage.setItem(LANG_KEY, lang);
  };

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      var current = document.documentElement.lang === 'en' ? 'en' : 'es';
      applyLang(current === 'en' ? 'es' : 'en');
    });
  }

  var savedLang = null;
  try { savedLang = localStorage.getItem(LANG_KEY); } catch (e) { /* storage unavailable */ }
  if (savedLang === 'en') applyLang('en');

  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Dropdown: hover on desktop (CSS), tap-to-open on mobile/touch
  document.querySelectorAll('[data-dropdown-toggle]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 900px)').matches) {
        e.preventDefault();
        link.closest('.nav-item').classList.toggle('open');
      }
    });
  });

  navLinks.querySelectorAll('.dropdown a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
    });
  });

  // Sticky header shrink on scroll
  var header = document.getElementById('siteHeader');
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Floating CTA appears after the hero
  var floatingCta = document.getElementById('floatingCta');
  var hero = document.querySelector('.hero');
  if (floatingCta && hero) {
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        floatingCta.classList.toggle('visible', !entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    ctaObserver.observe(hero);
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  // Animated counters
  var counters = document.querySelectorAll('.stat-number[data-count]');
  var animateCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var duration = 1400;
    var start = null;
    var step = function (ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  // Active nav link highlighting (by current page path)
  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links > .nav-item > a').forEach(function (link) {
    var linkPath = link.getAttribute('href').split('#')[0].replace(/\/$/, '') || '/';
    if (linkPath === currentPath) link.classList.add('active');
  });

  // Contact forms (Inicio + Fundición Maxxima share the same handler)
  var CONTACT_ENDPOINT = '/api/contacto';

  document.querySelectorAll('.contact-form').forEach(function (form) {
    var feedback = form.querySelector('[data-feedback]');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (form.empresa_web.value) return; // honeypot tripped, fail silently

      if (!form.checkValidity()) {
        feedback.textContent = 'Por favor completa los campos requeridos.';
        feedback.className = 'form-feedback err';
        return;
      }

      var formData = new FormData(form);
      formData.set('origen', form.getAttribute('data-origen') || 'CONEXT LP');
      var params = new URLSearchParams(formData);

      submitBtn.disabled = true;
      feedback.textContent = 'Enviando...';
      feedback.className = 'form-feedback';

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.estatus) {
            feedback.textContent = result.message || 'Gracias, recibimos tu mensaje.';
            feedback.className = 'form-feedback ok';
            form.reset();
          } else {
            feedback.textContent = result.message || 'No se pudo enviar tu mensaje, intenta de nuevo.';
            feedback.className = 'form-feedback err';
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          feedback.textContent = 'Hubo un problema de conexión. Escríbenos directo a ventas@conext.com.mx.';
          feedback.className = 'form-feedback err';
        });
    });
  });
});
