export function showInlineError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

export function clearInlineError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

export function setStatusBanner(el, message, tone = 'info') {
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.className = 'status-banner hidden';
    return;
  }
  el.textContent = message;
  el.className = `status-banner status-banner--${tone}`;
}

export function setButtonBusy(button, busy, busyText = 'Loading…') {
  if (!button) return () => {};

  if (!busy) {
    button.disabled = false;
    return () => {};
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = busyText;

  return () => {
    button.disabled = false;
    button.textContent = originalText;
  };
}
