import { icons } from './icons.js';
import { createField, draw, settle } from './moss-field.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const gallery = document.getElementById('studies');
gallery.innerHTML = icons.map(({ id, name, src }, index) => `
  <figure>
    <button class="screen" type="button" aria-pressed="false" aria-label="Grow moss on ${name}">
      <span class="icon-field">
        <canvas class="moss-layer back" aria-hidden="true"></canvas>
        <img class="icon" src="${src}" width="128" height="128" alt="">
        <canvas class="moss-layer front" aria-hidden="true"></canvas>
      </span>
    </button>
    <figcaption><div class="label"><span>0${index + 1} / ${name}</span><span class="status" role="status">Bare</span></div><a href="index.html?icon=${id}">Try on site ↗</a></figcaption>
  </figure>
`).join('');
const fields = await Promise.all([...gallery.querySelectorAll('figure')].map(async (figure, index) => {
  const image = figure.querySelector('img');
  await image.decode();
  const field = createField(figure, 144, 177, ink => ink.drawImage(image, 30, 24, 84, 84));
  const button = figure.querySelector('button');
  const status = figure.querySelector('.status');
  function setBlocked(blocked) {
    field.growth.setBlocked(blocked);
    button.setAttribute('aria-pressed', String(blocked));
    button.setAttribute('aria-label', `${blocked ? 'Dry' : 'Grow'} moss on ${icons[index].name}`);
    status.textContent = blocked ? 'Growing' : 'Drying';
    if (reducedMotion.matches) {
      if (blocked) settle(field, 100);
      else field.growth.cells.fill(0);
    }
    if (!blocked && !field.growth.cells.some(age => age > 0)) status.textContent = 'Bare';
    draw(field);
  }
  button.addEventListener('click', () => setBlocked(!field.growth.blocked));
  return { field, setBlocked, status };
}));
document.getElementById('grow').addEventListener('click', () => fields.forEach(field => field.setBlocked(true)));
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
