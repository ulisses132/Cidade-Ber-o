const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    toggle?.setAttribute('aria-expanded', 'false');
    navigation?.classList.remove('open');
  }
});

const search = document.querySelector('#archive-search');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase('pt');
  const cards = [...document.querySelectorAll('.archive-grid .edition-card')];
  let count = 0;
  cards.forEach(card => {
    card.hidden = !card.textContent.toLocaleLowerCase('pt').includes(query);
    if (!card.hidden) count += 1;
  });
  document.querySelector('#archive-count').textContent = `${count} ${count === 1 ? 'edição' : 'edições'}`;
  document.querySelector('#no-results').hidden = count > 0;
});
