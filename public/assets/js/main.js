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
    root.querySelectorAll('[data-i18n-href-es]').forEach(function (el) {
      var href = lang === 'en' ? el.getAttribute('data-i18n-href-en') : el.getAttribute('data-i18n-href-es');
      if (href != null) el.setAttribute('href', href);
    });
    root.querySelectorAll('[data-i18n-aria-label-es]').forEach(function (el) {
      var label = lang === 'en' ? el.getAttribute('data-i18n-aria-label-en') : el.getAttribute('data-i18n-aria-label-es');
      if (label != null) el.setAttribute('aria-label', label);
    });
    root.querySelectorAll('[data-i18n-alt-es]').forEach(function (el) {
      var alt = lang === 'en' ? el.getAttribute('data-i18n-alt-en') : el.getAttribute('data-i18n-alt-es');
      if (alt != null) el.setAttribute('alt', alt);
    });
  };

  var translatedText = function (key, fallback) {
    var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    var entry = dict[key];
    return entry && entry[lang] != null ? entry[lang] : fallback;
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

  // Prefills the contact form when arriving from a product's "Contacto" link
  // (?categoria=metales|quimicos&producto_es=...&producto_en=...).
  var quoteParams = new URLSearchParams(location.search);
  var quoteProductoEs = quoteParams.get('producto_es');
  var quoteProductoEn = quoteParams.get('producto_en');
  if (quoteProductoEs || quoteProductoEn) {
    var quoteForm = document.getElementById('contactForm');
    if (quoteForm) {
      var quoteLang = document.documentElement.lang === 'en' ? 'en' : 'es';
      var quoteNombre = quoteLang === 'en' ? (quoteProductoEn || quoteProductoEs) : (quoteProductoEs || quoteProductoEn);
      var quoteMensajeField = quoteForm.querySelector('#mensaje');
      if (quoteMensajeField) {
        quoteMensajeField.value = quoteLang === 'en'
          ? 'Hello, I would like to request more information about ' + quoteNombre + '!'
          : '¡Hola, me gustaría solicitar más información sobre ' + quoteNombre + '!';
      }
      var quoteOptKey = quoteParams.get('categoria') === 'metales' ? 'contacto.form.opt1'
        : quoteParams.get('categoria') === 'quimicos' ? 'contacto.form.opt2' : null;
      var quoteOpt = quoteOptKey && quoteForm.querySelector('[data-i18n="' + quoteOptKey + '"]');
      if (quoteOpt) quoteOpt.selected = true;
    }
  }

  // Contact forms (Inicio + Fundición Maxxima share the same handler)
  var CONTACT_ENDPOINT = '/api/contacto';

  document.querySelectorAll('.contact-form').forEach(function (form) {
    var feedback = form.querySelector('[data-feedback]');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (form.empresa_web.value) return; // honeypot tripped, fail silently

      var hasEmptyRequiredField = Array.prototype.some.call(form.querySelectorAll('[required]'), function (field) {
        return !String(field.value).trim();
      });
      if (hasEmptyRequiredField || !form.checkValidity()) {
        feedback.textContent = translatedText('contacto.form.required', 'Por favor completa los campos requeridos.');
        feedback.className = 'form-feedback err';
        return;
      }

      if (form.querySelector('.g-recaptcha') && (!window.grecaptcha || !window.grecaptcha.getResponse())) {
        feedback.textContent = translatedText('contacto.form.recaptcha', 'Por favor completa el reCAPTCHA.');
        feedback.className = 'form-feedback err';
        return;
      }

      var formData = new FormData(form);
      formData.set('origen', form.getAttribute('data-origen') || 'CONEXT LP');
      var params = new URLSearchParams(formData);

      submitBtn.disabled = true;
      feedback.textContent = translatedText('contacto.form.sending', 'Enviando...');
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
            feedback.textContent = document.documentElement.lang === 'en'
              ? translatedText('contacto.form.success', 'Thank you, we received your message.')
              : (result.message || translatedText('contacto.form.success', 'Gracias, recibimos tu mensaje.'));
            feedback.className = 'form-feedback ok';
            form.reset();
          } else {
            feedback.textContent = document.documentElement.lang === 'en'
              ? translatedText('contacto.form.error', 'Your message could not be sent. Please try again.')
              : (result.message || translatedText('contacto.form.error', 'No se pudo enviar tu mensaje, intenta de nuevo.'));
            feedback.className = 'form-feedback err';
          }
          if (window.grecaptcha && form.querySelector('.g-recaptcha')) window.grecaptcha.reset();
        })
        .catch(function () {
          submitBtn.disabled = false;
          feedback.textContent = translatedText('contacto.form.networkError', 'Hubo un problema de conexión. Escríbenos directo a ventas@conext.com.mx.');
          feedback.className = 'form-feedback err';
          if (window.grecaptcha && form.querySelector('.g-recaptcha')) window.grecaptcha.reset();
        });
    });
  });

  // Product contact-notice modal — used on both product pages. Each trigger
  // carries the product name in data-i18n-es/en; the modal just shows that
  // name plus a fixed notice asking to contact us for the technical
  // datasheet or more information (no specs are published on the site).
  var fichaModal = document.getElementById('fichaModal');
  if (fichaModal) {
    var fichaModalBody = document.getElementById('fichaModalBody');
    var lastFocused = null;

    var openFichaModal = function (btn) {
      var nombreEs = btn.getAttribute('data-i18n-es') || '';
      var nombreEn = btn.getAttribute('data-i18n-en') || nombreEs;
      var msgEs = 'Para la ficha técnica o más información de este producto, ponte en contacto con nosotros.';
      var msgEn = 'For the technical datasheet or more information about this product, please contact us.';

      fichaModalBody.innerHTML = '';
      var h3 = document.createElement('h3');
      h3.id = 'fichaModalTitle';
      h3.setAttribute('data-i18n-es', nombreEs);
      h3.setAttribute('data-i18n-en', nombreEn);
      h3.textContent = nombreEs;
      var p = document.createElement('p');
      p.className = 'ficha-desc';
      p.setAttribute('data-i18n-es', msgEs);
      p.setAttribute('data-i18n-en', msgEn);
      p.textContent = msgEs;
      var categoria = btn.getAttribute('data-categoria') || '';
      var a = document.createElement('a');
      a.href = '/contacto?categoria=' + encodeURIComponent(categoria) +
        '&producto_es=' + encodeURIComponent(nombreEs) +
        '&producto_en=' + encodeURIComponent(nombreEn);
      a.className = 'btn-cta';
      a.setAttribute('data-i18n', 'nav.contacto');
      a.textContent = 'Contacto';
      fichaModalBody.appendChild(h3);
      fichaModalBody.appendChild(p);
      fichaModalBody.appendChild(a);

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
      btn.addEventListener('click', function () { openFichaModal(btn); });
    });
    fichaModal.querySelectorAll('[data-ficha-close]').forEach(function (el) {
      el.addEventListener('click', closeFichaModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fichaModal.classList.contains('open')) closeFichaModal();
    });
  }
});
