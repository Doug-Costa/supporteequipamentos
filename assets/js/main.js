/* Support Equipamentos — interações (JS puro, sem dependências) */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA_PHONE = '551146174001';
  const EMAIL = 'anderson@supportequipamento.com.br';

  /* ---------- Ano no rodapé ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header ao rolar + botão topo ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });
  window.matchMedia('(min-width: 992px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Link ativo conforme a seção ---------- */
  const navLinks = $$('.nav ul a[href^="#"]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Hero slider ---------- */
  const slides = $$('.hero__slide');
  const captions = [
    ['Plataforma cremalheira – SUP 30 X 150', 'Acesso às fachadas com segurança e produtividade.'],
    ['Balancim elétrico – SUP 630', 'Agilidade para pintura e limpeza de fachadas.'],
    ['Trabalho em fachadas', 'Estabilidade com alta capacidade de carga.']
  ];
  const capBox = $('.hero__card-text');
  const bar = $('#heroBar');
  const DURATION = 7000;
  let current = 0, timer = null;

  const goTo = (i) => {
    slides[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    const slide = slides[current];
    const img = $('img', slide);
    img.loading = 'eager';
    slide.classList.add('is-active');
    $('#heroTag').textContent = `0${current + 1} / 0${slides.length}`;
    $('#heroCapTitle').textContent = captions[current][0];
    $('#heroCapText').textContent = captions[current][1];
    capBox.classList.remove('is-changing'); void capBox.offsetWidth; capBox.classList.add('is-changing');
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    bar.classList.remove('run'); void bar.offsetWidth;
    if (reduceMotion) return;
    bar.style.setProperty('--dur', DURATION + 'ms');
    bar.classList.add('run');
    timer = setTimeout(() => goTo(current + 1), DURATION);
  };
  $('#heroNext').addEventListener('click', () => goTo(current + 1));
  $('#heroPrev').addEventListener('click', () => goTo(current - 1));
  // pré-carrega os próximos slides depois que a página carregar
  window.addEventListener('load', () => slides.forEach(s => { $('img', s).loading = 'eager'; }));
  // pausa quando a aba não está visível
  document.addEventListener('visibilitychange', () => { document.hidden ? clearTimeout(timer) : restart(); });
  // swipe no hero
  let sx = null;
  const hero = $('.hero');
  hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    sx = null;
  });
  restart();

  /* ---------- Reveal ao rolar ---------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ---------- Contadores ---------- */
  const countObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, dur = 1600, t0 = performance.now();
      if (reduceMotion) { el.textContent = end; obs.unobserve(el); return; }
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* ---------- Abas (equipamentos) ---------- */
  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role="tab"]', box);
    const select = (tab) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        select(n); n.focus();
      });
    });
  });

  /* ---------- Galeria: "ver todas" ---------- */
  const VISIBLE = 12;
  const items = $$('.gallery__item');
  const moreBtn = $('#galleryMore');
  if (items.length > VISIBLE) {
    items.slice(VISIBLE).forEach(it => it.classList.add('is-hidden'));
    moreBtn.addEventListener('click', () => {
      items.forEach((it, i) => {
        if (!it.classList.contains('is-hidden')) return;
        it.classList.remove('is-hidden');
        it.style.animationDelay = ((i - VISIBLE) % 12) * 40 + 'ms';
        it.classList.add('reveal-in');
      });
      moreBtn.parentElement.remove();
    });
  } else if (moreBtn) {
    moreBtn.parentElement.remove();
  }

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCount = $('#lbCount');
  let lbIndex = 0, lastFocus = null;

  const show = (i) => {
    lbIndex = (i + items.length) % items.length;
    const a = items[lbIndex];
    lbImg.classList.add('is-loading');
    lbImg.onload = () => lbImg.classList.remove('is-loading');
    lbImg.src = a.getAttribute('href');
    lbImg.alt = $('img', a).alt;
    lbCount.textContent = `${lbIndex + 1} / ${items.length}`;
    // pré-carrega a próxima
    const nxt = new Image(); nxt.src = items[(lbIndex + 1) % items.length].getAttribute('href');
  };
  const openLb = (i) => {
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    $('.lightbox__close', lb).focus();
  };
  const closeLb = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = 'data:,';
    if (lastFocus) lastFocus.focus();
  };
  items.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); openLb(i); }));
  lb.addEventListener('click', e => {
    const act = e.target.closest('[data-lb]')?.dataset.lb;
    if (act === 'close') closeLb();
    else if (act === 'prev') show(lbIndex - 1);
    else if (act === 'next') show(lbIndex + 1);
    else if (e.target === lb) closeLb();
  });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(lbIndex + 1);
    if (e.key === 'ArrowLeft') show(lbIndex - 1);
    if (e.key === 'Tab') { // mantém o foco dentro do lightbox
      const f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let lx = null;
  lb.addEventListener('touchstart', e => { lx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (lx === null) return;
    const dx = e.changedTouches[0].clientX - lx;
    if (Math.abs(dx) > 50) show(lbIndex + (dx < 0 ? 1 : -1));
    lx = null;
  });

  /* ---------- Formulário: envia por WhatsApp ou e-mail ---------- */
  const form = $('#contactForm');
  const err = $('#formError');
  let via = 'whatsapp';
  $$('button[type="submit"]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
  $$('input, textarea', form).forEach(f => f.addEventListener('input', () => f.parentElement.classList.remove('is-invalid')));

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const valid = f.value.trim() !== '' && f.checkValidity();
      f.parentElement.classList.toggle('is-invalid', !valid);
      if (!valid && ok) { f.focus(); ok = false; }
    });
    err.hidden = ok;
    if (!ok) return;

    const d = Object.fromEntries(new FormData(form));
    const lines = [
      `Olá! Meu nome é ${d.nome.trim()}.`,
      `E-mail: ${d.email.trim()}`,
      d.telefone.trim() ? `Telefone: ${d.telefone.trim()}` : '',
      `Assunto: ${d.assunto.trim()}`,
      '',
      d.mensagem.trim()
    ].filter((l, i) => l !== '' || i === 4);
    const body = lines.join('\n');

    if (via === 'email') {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('[Site] ' + d.assunto.trim())}&body=${encodeURIComponent(body)}`;
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${WA_PHONE}&text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    }
  });

  /* ---------- Mapa (carrega só quando chega perto) ---------- */
  const map = $('#map');
  if (map) {
    const mapObs = new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      const ifr = document.createElement('iframe');
      ifr.src = map.dataset.src;
      ifr.title = 'Mapa: Estrada dos Estudantes, 485 – Cotia/SP';
      ifr.loading = 'lazy';
      ifr.referrerPolicy = 'no-referrer-when-downgrade';
      map.replaceChildren(ifr);
      obs.disconnect();
    }, { rootMargin: '300px' });
    mapObs.observe(map);
  }

  /* ---------- Dica do WhatsApp aparece uma vez ---------- */
  const wa = $('.wa-float');
  setTimeout(() => { wa.classList.add('show-tip'); setTimeout(() => wa.classList.remove('show-tip'), 4000); }, 3500);
})();
