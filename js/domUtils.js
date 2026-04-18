export function getImageUrl(card, size = 'small') {
  if (!card) return null;
  const uris = card.image_uris || 
    (Array.isArray(card.card_faces) && card.card_faces[0]?.image_uris);
  return uris ? uris[size] || uris.small || uris.normal || null : null;
}

export function createCardSlot(card, options = {}) {
  const {
    index = 0,
    delayMs = 35,
    baseClass = 'card-slot fade-in',
    extraClasses = [],
    role = 'button',
    tabIndex = 0,
    ariaLabel,
    title,
    onClick,
    onKeydown,
    lazyLoad = false,
    imageSize = 'small',
  } = options;

  const slot = document.createElement('div');
  slot.className = [baseClass, ...extraClasses].filter(Boolean).join(' ');
  slot.style.animationDelay = `${index * delayMs}ms`;

  if (role !== null && role !== undefined) {
    slot.setAttribute('role', role);
  }
  if (tabIndex !== null && tabIndex !== undefined) {
    slot.setAttribute('tabindex', String(tabIndex));
  }
  if (ariaLabel) {
    slot.setAttribute('aria-label', ariaLabel);
  }
  if (title) {
    slot.title = title;
  }

  if (onClick) {
    slot.addEventListener('click', onClick);
  }
  if (onKeydown) {
    slot.addEventListener('keydown', onKeydown);
  }

  const src = getImageUrl(card, imageSize);
  if (src && !card.placeholder) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = card.name;
    img.width = 146;
    img.height = 204;
    if (lazyLoad) img.loading = 'lazy';
    slot.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-placeholder';
    ph.textContent = card.name;
    slot.appendChild(ph);
  }

  return slot;
}

export function appendCardSlot(container, card, options = {}) {
  const slot = createCardSlot(card, options);
  container.appendChild(slot);
  return slot;
}