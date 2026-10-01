import { icons } from './icons.js';
import { createIconField, createWordmarkField, draw, settle } from './moss-field.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
await document.fonts.ready;

function connectPreview(element, field, name) {
  const button = element.querySelector('button');
  const preview = { field, status: element.querySelector('.status'), setBlocked };
  function setBlocked(blocked) {
    const { field, status } = preview;
    field.growth.setBlocked(blocked);
    button.setAttribute('aria-pressed', String(blocked));
    button.setAttribute('aria-label', `${blocked ? 'Dry' : 'Grow'} moss on ${name}`);
    status.textContent = blocked ? 'Growing' : 'Drying';
    if (reducedMotion.matches) {
      if (blocked) settle(field, 100);
      else field.growth.cells.fill(0);
    }
    if (!blocked && !field.growth.cells.some(age => age > 0)) status.textContent = 'Bare';
    draw(field);
  }
  button.addEventListener('click', () => setBlocked(!preview.field.growth.blocked));
  return preview;
}

const fields = await Promise.all(icons.map(async icon => {
  const computer = icon.id.startsWith('computer');
  const provided = icon.src.endsWith('.png');
  const figure = document.createElement('figure');
  figure.innerHTML = `
    <button class="screen" type="button" aria-pressed="false" aria-label="Grow moss on ${icon.name}">
      <span class="icon-field">
        <canvas class="moss-layer back" aria-hidden="true"></canvas>
        <img class="icon" src="${icon.src}" width="128" height="128" alt="">
        <canvas class="moss-layer front" aria-hidden="true"></canvas>
      </span>
      ${computer ? '<span class="computer-name" aria-hidden="true">Moss Computer</span>' : ''}
    </button>
    <figcaption><div class="label"><span>${icon.name}</span><span class="status" role="status">Bare</span></div><a href="index.html?icon=${icon.id}">Try on site ↗</a></figcaption>
  `;
  document.getElementById(provided ? 'images' : computer ? 'computers' : 'studies').append(figure);
  const image = figure.querySelector('img');
  await image.decode();
  return connectPreview(figure, createIconField(figure, image, icon), icon.name);
}));

for (const icon of icons.filter(icon => icon.src.endsWith('.png'))) {
  for (const replaceO of [false, true]) {
    const study = document.createElement('article');
    study.className = 'wordmark-study';
    const label = `${icon.id.endsWith('1') ? 'Dark' : 'Light'} screen / ${replaceO ? 'computer “o”' : 'Moss + computer'}`;
    study.innerHTML = `
      <h3>${label}</h3>
      <button class="wordmark-preview" type="button" aria-pressed="false" aria-label="Grow moss on ${label}">
        <span class="wordmark" aria-hidden="true">
          <canvas class="moss-layer back"></canvas>
          <span data-ink>${replaceO ? 'M' : 'Moss'}</span><img data-ink class="${replaceO ? 'wordmark-computer-o' : 'wordmark-computer'} brand-icon" src="${icon.src}" width="128" height="128" alt="">${replaceO ? '<span data-ink>ss</span>' : ''}
          <canvas class="moss-layer front"></canvas>
        </span>
      </button>
      <p class="wordmark-caption">${replaceO ? 'Moss' : 'Moss Computer'} <span class="status" role="status">Bare</span></p>
    `;
    document.getElementById('computer-wordmarks').append(study);
  }
}
await Promise.all([...document.querySelectorAll('.wordmark-study')].map(async study => {
  const wordmark = study.querySelector('.wordmark');
  const image = wordmark.querySelector('img');
  await image.decode();
  const imageOptions = icons.find(icon => icon.src === image.getAttribute('src'));
  const preview = connectPreview(study, createWordmarkField(wordmark, undefined, imageOptions), study.querySelector('h2, h3').textContent);
  fields.push(preview);
  new ResizeObserver(() => {
    const next = createWordmarkField(wordmark, preview.field, imageOptions);
    if (next === preview.field) return;
    const blocked = preview.field.growth.blocked;
    preview.field = next;
    preview.setBlocked(blocked);
  }).observe(wordmark);
}));

document.getElementById('grow').addEventListener('click', () => fields.forEach(preview => preview.setBlocked(true)));
document.getElementById('reset').addEventListener('click', () => {
  fields.forEach(({ field, setBlocked }) => { field.growth.cells.fill(0); setBlocked(false); });
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) fields.forEach(({ field, setBlocked }) => setBlocked(field.growth.blocked));
});
setInterval(() => {
  if (document.hidden || reducedMotion.matches) return;
  fields.forEach(({ field, status }) => {
    if (field.growth.blocked || field.growth.cells.some(age => age > 0)) {
      field.growth.step();
      draw(field);
      if (!field.growth.blocked && !field.growth.cells.some(age => age > 0)) status.textContent = 'Bare';
    }
  });
}, 100);
