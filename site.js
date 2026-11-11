(() => {
  const primaryNav = document.querySelector('.nav');
  if (primaryNav) {
    primaryNav.innerHTML = `
      <a href="about.html">About</a>
      <a href="index.html#how-it-works">How It Works</a>
      <a href="conditions.html">What I Treat</a>
      <a href="endometriosis-care.html">Endometriosis</a>
      <a href="shop.html">Shop</a>
      <a href="resources.html">Education</a>
      <a href="index.html#faq">FAQ</a>
      <a class="button button-sm" href="https://drnataliebozinovski.janeapp.com/" rel="noopener" target="_blank">Book Now <span aria-hidden="true">→</span></a>`;
  }
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const navTrigger = document.querySelector('.nav-trigger');
  const navItem = navTrigger?.closest('.nav-item');

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
    document.body.classList.toggle('menu-open', Boolean(open));
  });

  navTrigger?.addEventListener('click', () => {
    const open = navItem?.classList.toggle('open');
    navTrigger.setAttribute('aria-expanded', String(Boolean(open)));
  });

  document.addEventListener('click', (event) => {
    if (navItem && !navItem.contains(event.target)) {
      navItem.classList.remove('open');
      navTrigger?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navItem?.classList.contains('open')) {
      navItem.classList.remove('open');
      navTrigger?.setAttribute('aria-expanded', 'false');
      navTrigger?.focus();
    }
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 10), { passive: true });

  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((link) => {
    const href = link.getAttribute('href')?.split('#')[0];
    if (href === current || (current === '' && href === 'index.html')) link.setAttribute('aria-current', 'page');
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  const quiz = document.querySelector('#endo-assessment');
  if (!quiz) return;

  const progress = document.querySelector('.progress-bar');
  const progressLabel = document.querySelector('.progress-label');
  const requiredGroups = [...quiz.querySelectorAll('[data-required="true"]')];
  const updateProgress = () => {
    const complete = requiredGroups.filter((group) => group.querySelector('input:checked')).length;
    const percentage = Math.round((complete / requiredGroups.length) * 100);
    if (progress) progress.style.width = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = `${complete} of ${requiredGroups.length} questions answered`;
  };
  quiz.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('input[type=\"checkbox\"]')) {
      const group = input.closest('fieldset');
      if (group) {
        const none = group.querySelector('input[data-none]');
        if (input.hasAttribute('data-none') && input.checked) {
          group.querySelectorAll('input[type=\"checkbox\"]:not([data-none])').forEach((box) => { box.checked = false; });
        } else if (input.checked && none) {
          none.checked = false;
        }
      }
    }
    updateProgress();
  });

  const surgerySelect = quiz.querySelector('#surgery');
  const surgeryCount = quiz.querySelector('[data-surgery-count]');
  const syncSurgeryField = () => {
    if (!surgeryCount || !surgerySelect) return;
    const show = surgerySelect.value === 'Yes';
    surgeryCount.hidden = !show;
    if (!show) {
      const input = surgeryCount.querySelector('input');
      if (input) input.value = '';
    }
  };
  surgerySelect?.addEventListener('change', syncSurgeryField);
  syncSurgeryField();

  const recommendations = {
    nutrition: ['Nutrition', 'Focus on reducing added sugars and highly processed foods while increasing nutrient-dense whole foods, fibre and cruciferous vegetables.'],
    digestive: ['Digestive health', 'Support regular bowel movements with hydration, fibre-rich foods and ground flaxseed when appropriate. Digestive symptoms can overlap with endometriosis and deserve assessment.'],
    inflammation: ['Inflammation', 'Reduce frequently consumed inflammatory foods and discuss food-first sources of omega-3s plus anti-inflammatory herbs such as turmeric or ginger with a qualified clinician.'],
    detoxification: ['Detoxification', 'Lower everyday chemical exposure by choosing unscented products, reducing heated plastic contact and supporting regular elimination and movement.'],
    stress: ['Stress and nervous system', 'Build in small, repeatable practices that support sleep, movement, connection and nervous-system regulation. Stress can influence immune and hormonal signalling.']
  };

  quiz.addEventListener('submit', (event) => {
    event.preventDefault();
    const incomplete = requiredGroups.filter((group) => !group.querySelector('input:checked'));
    const error = quiz.querySelector('.form-error');
    if (incomplete.length) {
      error?.classList.add('visible');
      incomplete[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    error?.classList.remove('visible');

    const scores = { nutrition: 0, digestive: 0, inflammation: 0, detoxification: 0, stress: 0 };
    quiz.querySelectorAll('input:checked[data-score]').forEach((input) => {
      scores[input.dataset.factor] += Number(input.dataset.score || 0);
    });

    const result = document.querySelector('.quiz-result');
    const scoreGrid = result?.querySelector('.score-grid');
    const resultList = result?.querySelector('.result-recommendations');
    if (!result || !scoreGrid || !resultList) return;

    scoreGrid.innerHTML = Object.entries(scores).map(([factor, score]) => {
      const label = recommendations[factor][0];
      return `<div class="score-item"><strong>${score}</strong><span>${label}</span></div>`;
    }).join('');

    const major = Object.entries(scores).filter(([, score]) => score >= 3);
    if (major.length) {
      resultList.innerHTML = major.map(([factor]) => {
        const [title, copy] = recommendations[factor];
        return `<div class="result-recommendation"><h3>${title}</h3><p>${copy}</p></div>`;
      }).join('');
    } else {
      resultList.innerHTML = '<div class="result-recommendation"><h3>No priority factor reached the screening threshold</h3><p>Your answers did not identify a score-based priority at this threshold. General education can still be useful, but these results should not be treated as a diagnosis or personalized clinical finding.</p></div>';
    }

    const heading = result.querySelector('[data-result-heading]');
    if (heading) heading.textContent = major.length ? `${major.length} priority factor${major.length === 1 ? '' : 's'} identified` : 'No priority factor identified';
    result.classList.add('visible');
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
