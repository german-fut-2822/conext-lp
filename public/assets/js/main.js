document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Language toggle (ES / EN)
  var LANG_KEY = 'conext-lang';
  var dict = window.CONEXT_I18N || {};
  var langToggle = document.getElementById('langToggle');
  var originalTitle = document.title;

  // Applies the current language to data-i18n / data-i18n-es-en elements within
  // a given root (document, or a subtree injected later e.g. a ficha modal).
  var applyLangWithin = function (root, lang) {
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = dict[el.getAttribute('data-i18n')];
      if (entry && entry[lang] != null) el.innerHTML = entry[lang];
    });
    root.querySelectorAll('[data-i18n-es]').forEach(function (el) {
      var value = lang === 'en' ? el.getAttribute('data-i18n-en') : el.getAttribute('data-i18n-es');
      if (value != null) el.innerHTML = value;
    });
  };

  var applyLang = function (lang) {
    applyLangWithin(document, lang);
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

  // Dropdown: hover on desktop (CSS), tap-to-open on mobile/touch. The toggle
  // has no page of its own (Productos is a dropdown label, not a route), so
  // it never navigates on any viewport.
  document.querySelectorAll('[data-dropdown-toggle]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.matchMedia('(max-width: 900px)').matches) {
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
  var headerTicking = false;
  var isScrolled = false;
  var updateHeaderScrolled = function () {
    // Hysteresis: different enter/exit thresholds so the class doesn't
    // flap (and re-trigger the max-height/padding transition) when the
    // scroll position hovers near a single cutoff.
    if (!isScrolled && window.scrollY > 56) {
      isScrolled = true;
    } else if (isScrolled && window.scrollY < 24) {
      isScrolled = false;
    }
    header.classList.toggle('scrolled', isScrolled);
    headerTicking = false;
  };
  window.addEventListener('scroll', function () {
    if (!headerTicking) { requestAnimationFrame(updateHeaderScrolled); headerTicking = true; }
  }, { passive: true });
  updateHeaderScrolled();

  // Pause the hero background video for users who prefer reduced motion
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo && reduceMotion) heroVideo.pause();

  // Scroll-grid: intensifies the background grid texture as the section scrolls through view
  var scrollGridEls = document.querySelectorAll('.scroll-grid');
  if (scrollGridEls.length) {
    if (reduceMotion) {
      scrollGridEls.forEach(function (el) { el.style.setProperty('--grid-progress', '.6'); });
    } else {
      var gridTicking = false;
      var updateScrollGrid = function () {
        scrollGridEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          progress = Math.max(0, Math.min(1, progress));
          el.style.setProperty('--grid-progress', progress.toFixed(3));
        });
        gridTicking = false;
      };
      window.addEventListener('scroll', function () {
        if (!gridTicking) { requestAnimationFrame(updateScrollGrid); gridTicking = true; }
      }, { passive: true });
      updateScrollGrid();
    }
  }


  // Floating CTA appears after the hero, hides again over the footer
  var floatingCta = document.getElementById('floatingCta');
  var hero = document.querySelector('.hero');
  var siteFooter = document.querySelector('.site-footer');
  if (floatingCta && hero) {
    var pastHero = false;
    var overFooter = false;
    var updateFloatingCta = function () {
      floatingCta.classList.toggle('visible', pastHero && !overFooter);
    };
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        pastHero = !entry.isIntersecting;
        updateFloatingCta();
      });
    }, { threshold: 0.1 });
    ctaObserver.observe(hero);

    if (siteFooter) {
      var footerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          overFooter = entry.isIntersecting;
          updateFloatingCta();
        });
      }, { threshold: 0.1 });
      footerObserver.observe(siteFooter);
    }
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

  // Abre el grupo de metales al llegar desde el grid del home (/productos/metales#cobre)
  var openHashCategory = function () {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.matches('details.metal-tile')) {
      target.open = true;
      target.classList.add('in-view');
      target.scrollIntoView({ block: 'start' });
    }
  };
  openHashCategory();
  window.addEventListener('hashchange', openHashCategory);

  // Animated counters
  var counters = document.querySelectorAll('[data-count]');
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
    if (link.hasAttribute('data-dropdown-toggle')) return; // label only, no page of its own
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

      if (form.querySelector('.g-recaptcha') && (!window.grecaptcha || !window.grecaptcha.getResponse())) {
        feedback.textContent = 'Por favor completa el reCAPTCHA.';
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
          if (window.grecaptcha && form.querySelector('.g-recaptcha')) window.grecaptcha.reset();
        })
        .catch(function () {
          submitBtn.disabled = false;
          feedback.textContent = 'Hubo un problema de conexión. Escríbenos directo a ventas@conext.com.mx.';
          feedback.className = 'form-feedback err';
          if (window.grecaptcha && form.querySelector('.g-recaptcha')) window.grecaptcha.reset();
        });
    });
  });

  // Product spec-sheet ("ficha") modal — used on both product pages. Each
  // trigger clones its matching <template id="ficha-{id}"> into the shared
  // modal body, then re-applies the current language to the injected markup
  // (applyLangWithin only runs once on load, so dynamically inserted content
  // needs a manual pass).
  var fichaModal = document.getElementById('fichaModal');
  if (fichaModal) {
    var fichaModalBody = document.getElementById('fichaModalBody');
    var lastFocused = null;

    var openFichaModal = function (id) {
      var tpl = document.getElementById('ficha-' + id);
      if (!tpl) return;
      fichaModalBody.innerHTML = '';
      fichaModalBody.appendChild(tpl.content.cloneNode(true));
      var currentLang = document.documentElement.lang === 'en' ? 'en' : 'es';
      applyLangWithin(fichaModalBody, currentLang);
      lastFocused = document.activeElement;
      fichaModal.setAttribute('aria-hidden', 'false');
      fichaModal.classList.add('open');
      document.body.classList.add('ficha-modal-lock');
      fichaModal.querySelector('.ficha-modal-close').focus();
    };

    var closeFichaModal = function () {
      fichaModal.setAttribute('aria-hidden', 'true');
      fichaModal.classList.remove('open');
      document.body.classList.remove('ficha-modal-lock');
      if (lastFocused) lastFocused.focus();
    };

    document.querySelectorAll('.ficha-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () { openFichaModal(btn.getAttribute('data-ficha')); });
    });
    fichaModal.querySelectorAll('[data-ficha-close]').forEach(function (el) {
      el.addEventListener('click', closeFichaModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fichaModal.classList.contains('open')) closeFichaModal();
    });
  }
});
