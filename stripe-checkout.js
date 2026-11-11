(() => {
  const triggerSelector = '[data-premium-resource]';
  if (!document.querySelector(triggerSelector)) return;

  const productLabels = {
    ivf: { title: 'Navigating IVF with Endometriosis', price: 'Price to be confirmed' },
    bonus: { title: 'Partnering With Your Fertility Team', price: 'Price to be confirmed' }
  };

  let errorModal = null;

  function popupFeatures() {
    const width = Math.min(620, Math.max(420, window.innerWidth - 36));
    const height = Math.min(820, Math.max(640, window.innerHeight - 40));
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));
    return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  }

  function writeLoadingPopup(win, info) {
    if (!win) return;
    try {
      win.document.open();
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Secure checkout</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2efe9;color:#332d2a;font-family:Arial,sans-serif}.box{width:min(420px,calc(100% - 40px));text-align:center}.line{width:38px;height:1px;background:#8c6e52;margin:0 auto 24px}.title{font-family:Georgia,serif;font-size:32px;line-height:1.1;margin:0 0 12px;font-weight:400}.meta{color:#685f59}.spinner{width:24px;height:24px;border:2px solid #d8d0c5;border-top-color:#8c6e52;border-radius:50%;margin:26px auto 0;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="box"><div class="line"></div><div class="title">${escapeHtml(info.title)}</div><div class="meta">${escapeHtml(info.price)} • Opening secure Stripe checkout</div><div class="spinner" aria-label="Loading"></div></div></body></html>`);
      win.document.close();
    } catch (_) {}
  }

  async function requestCheckout(resource) {
    const endpoints = [
      '/api/stripe.php?action=create',
      '/api/create-checkout-session'
    ];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ resource })
        });
        const type = response.headers.get('content-type') || '';
        const data = type.includes('application/json')
          ? await response.json()
          : { error: (await response.text()).trim() || `Payment endpoint returned HTTP ${response.status}.` };
        if (!response.ok) {
          if (response.status === 404) {
            lastError = new Error(data.error || 'Payment endpoint not found.');
            continue;
          }
          throw new Error(data.error || 'Unable to start secure checkout.');
        }
        if (!data.url) throw new Error('The payment server did not return a Stripe Checkout URL.');
        return data;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('The payment server is not reachable.');
  }

  function ensureErrorModal() {
    if (errorModal) return errorModal;
    errorModal = document.createElement('div');
    errorModal.className = 'payment-modal';
    errorModal.setAttribute('aria-hidden', 'true');
    errorModal.innerHTML = `
      <div class="payment-modal-backdrop" data-payment-close></div>
      <section class="payment-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <button type="button" class="payment-modal-close" data-payment-close aria-label="Close">×</button>
        <div class="payment-modal-header">
          <span class="eyebrow">Secure PDF access</span>
          <h2 id="payment-modal-title">Checkout could not start</h2>
          <p class="payment-modal-meta">No payment was taken.</p>
        </div>
        <div class="payment-modal-error" id="payment-modal-error" role="alert"></div>
      </section>`;
    document.body.appendChild(errorModal);
    errorModal.querySelectorAll('[data-payment-close]').forEach((el) => el.addEventListener('click', closeErrorModal));
    return errorModal;
  }

  function showError(message) {
    const root = ensureErrorModal();
    root.querySelector('#payment-modal-error').textContent = message || 'Unable to start secure checkout.';
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('payment-open');
    root.querySelector('.payment-modal-close')?.focus();
  }

  function closeErrorModal() {
    if (!errorModal) return;
    errorModal.classList.remove('open');
    errorModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('payment-open');
  }

  async function beginCheckout(resource) {
    const info = productLabels[resource];
    if (!info) return;

    // Open immediately from the click event so browser popup blockers allow Stripe Checkout.
    const checkoutWindow = window.open('', 'healthCityStripeCheckout', popupFeatures());
    writeLoadingPopup(checkoutWindow, info);

    try {
      const data = await requestCheckout(resource);
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.replace(data.url);
        checkoutWindow.focus();
      } else {
        // Popup blocked: safely fall back to current tab.
        window.location.assign(data.url);
      }
    } catch (err) {
      try { if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close(); } catch (_) {}
      showError(err?.message || 'Unable to connect to the secure payment server.');
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[ch]);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(triggerSelector);
    if (!trigger) return;
    event.preventDefault();
    beginCheckout(trigger.dataset.premiumResource);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && errorModal?.classList.contains('open')) closeErrorModal();
  });
})();
