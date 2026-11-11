(async () => {
  const status = document.querySelector('[data-payment-status]');
  const details = document.querySelector('[data-payment-details]');
  const download = document.querySelector('[data-secure-download]');
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  if (!sessionId) {
    status.textContent = 'Payment session not found.';
    details.textContent = 'Return to the resource page and try again.';
    return;
  }

  async function getStatus() {
    const endpoints = [
      `/api/stripe.php?action=status&session_id=${encodeURIComponent(sessionId)}`,
      `/api/session-status?session_id=${encodeURIComponent(sessionId)}`
    ];
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
        const type = response.headers.get('content-type') || '';
        const data = type.includes('application/json')
          ? await response.json()
          : { error: (await response.text()).trim() || `Payment endpoint returned HTTP ${response.status}.` };
        if (!response.ok) {
          if (response.status === 404) { lastError = new Error(data.error || 'Payment endpoint not found.'); continue; }
          throw new Error(data.error || 'Unable to verify payment.');
        }
        return data;
      } catch (err) { lastError = err; }
    }
    throw lastError || new Error('Payment verification server is not reachable.');
  }

  try {
    const data = await getStatus();
    if (!data.paid) {
      status.textContent = 'Payment has not completed yet.';
      details.textContent = 'If you closed Stripe before paying, return to the resource page and try again.';
      return;
    }

    status.textContent = 'Payment confirmed. Your download is ready.';
    details.textContent = data.customerEmail
      ? `Receipt email: ${data.customerEmail}`
      : 'Your purchase has been verified securely.';
    download.href = data.downloadUrl;
    download.hidden = false;

    // Start one download automatically, while leaving a visible button as a fallback.
    window.setTimeout(() => {
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, 500);

    try {
      window.opener?.postMessage({ type: 'health-city-payment-complete', resource: data.resource }, window.location.origin);
    } catch (_) {}
  } catch (error) {
    status.textContent = 'We could not verify the payment.';
    details.textContent = error?.message || 'Please contact the practice if your card was charged.';
  }
})();
