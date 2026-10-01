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
  document.getElementById(computer ? 'computers' : 'studies').append(figure);
  const image = figure.querySelector('img');
  await image.decode();
  return connectPreview(figure, createIconField(figure, image, icon.fullHeight), icon.name);
}));

const wordmarkStudy = document.querySelector('.wordmark-study');
const wordmark = wordmarkStudy.querySelector('.wordmark');
await wordmark.querySelector('img').decode();
const wordmarkPreview = connectPreview(wordmarkStudy, createWordmarkField(wordmark), 'the river stone wordmark');
fields.push(wordmarkPreview);
new ResizeObserver(() => {
  const next = createWordmarkField(wordmark, wordmarkPreview.field);
  if (next === wordmarkPreview.field) return;
  const blocked = wordmarkPreview.field.growth.blocked;
  wordmarkPreview.field = next;
  wordmarkPreview.setBlocked(blocked);
}).observe(wordmark);

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
