// Shared zoom modal — imported once; side-effects bind events on load
const modal = document.getElementById('zoom-modal');
modal.setAttribute('tabindex', '-1');

function getImageUrl(card, size) {
  const uris = card.image_uris || card.card_faces?.[0]?.image_uris;
  return uris ? uris[size] || uris.small || uris.normal || null : null;
}

export function openZoom(card) {
  const src = getImageUrl(card, 'normal');
  if (!src && card.placeholder) return;

  modal.innerHTML = '';
  if (src) {
    const img = document.createElement('img');
    img.src = src; img.alt = card.name;
    modal.appendChild(img);
  }
  const label = document.createElement('div');
  label.className = 'zoom-card-name';
  label.textContent = card.name;
  modal.appendChild(label);

  modal.className = 'zoom-overlay';
  modal.focus();
}

export function closeZoom() {
  modal.className = 'hidden';
  modal.innerHTML = '';
}

modal.addEventListener('click', closeZoom);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeZoom();
});
