'use strict';

// Add the final destinations here when the releases are public.
// Leave null to keep the visible, non-clickable "Coming soon" state.
const RELEASES = Object.freeze({
  paper: null,
  code: null,
});

for (const resource of document.querySelectorAll('[data-resource]')) {
  const url = RELEASES[resource.dataset.resource];
  if (!url) continue;
  const parsed = new URL(url, document.baseURI);
  if (parsed.protocol !== 'https:' && parsed.origin !== location.origin) continue;
  resource.href = parsed.href;
  resource.classList.remove('unavailable');
  resource.removeAttribute('aria-disabled');
  resource.querySelector('[data-resource-status]').textContent = 'Available now';
}

const grid = document.getElementById('mask-grid');
const cells = Array.from({ length: 144 }, () => {
  const cell = document.createElement('span');
  cell.className = 'matrix-cell';
  grid.append(cell);
  return cell;
});
const density = document.getElementById('density');

function randomIndex(upperBound) {
  const sample = new Uint32Array(1);
  const limit = Math.floor(4294967296 / upperBound) * upperBound;
  do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
  return sample[0] % upperBound;
}

function resampleMask() {
  const count = Math.round(cells.length * Number(density.value) / 100);
  const order = cells.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const selected = new Set(order.slice(0, count));
  cells.forEach((cell, index) => cell.classList.toggle('selected', selected.has(index)));
  document.getElementById('density-label').textContent = `${density.value}%`;
  document.getElementById('entry-count').textContent = `${count} of ${cells.length} entries`;
}
density.addEventListener('input', resampleMask);
document.getElementById('resample').addEventListener('click', resampleMask);
resampleMask();

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const index = tabs.indexOf(tab);
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    next.focus();
  });
}

const svg = document.getElementById('opf-chart');
const svgNS = 'http://www.w3.org/2000/svg';
function svgElement(tag, attributes, text) {
  const element = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  svg.append(element);
  return element;
}
const chart = { left: 122, right: 585, top: 18, bottom: 286, max: 0.012 };
const chartX = value => chart.left + (chart.right - chart.left) * value / chart.max;
for (const tick of [0, 0.004, 0.008, 0.012]) {
  const x = chartX(tick);
  svgElement('line', { x1: x, x2: x, y1: chart.top, y2: chart.bottom, stroke: '#e6e7e2', 'stroke-width': 1 });
  svgElement('text', { x, y: 312, 'text-anchor': 'middle', fill: '#7a8288', 'font-size': 12 }, tick === 0 ? '0' : tick.toFixed(3));
}
const opfData = [
  { name: 'IEEE-300', valueOnly: 0.0116, sobolev: 0.0099 },
  { name: 'PEGASE-1k', valueOnly: 0.0098, sobolev: 0.0066 },
  { name: 'RTE-6k', valueOnly: 0.0059, sobolev: 0.0042 },
];
opfData.forEach((item, index) => {
  const y = 29 + index * 92;
  svgElement('text', { x: 0, y: y + 16, fill: '#303b45', 'font-size': 14, 'font-weight': 550 }, item.name);
  const reduction = Math.round((item.valueOnly - item.sobolev) / item.valueOnly * 100);
  svgElement('text', { x: 0, y: y + 37, fill: '#7551a7', 'font-size': 11 }, `${reduction}% lower`);
  for (const [offset, value, fill] of [[0, item.valueOnly, '#b6bfc4'], [28, item.sobolev, '#7551a7']]) {
    const width = chartX(value) - chart.left;
    svgElement('rect', { x: chart.left, y: y + offset, width, height: 19, rx: 3, fill });
    svgElement('text', { x: chartX(value) + 8, y: y + offset + 14, fill: '#5c656d', 'font-size': 12 }, value.toFixed(4));
  }
});

const copyButton = document.getElementById('copy-citation');
copyButton.addEventListener('click', async () => {
  const text = document.getElementById('bibtex').textContent.trim();
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = 'Copied';
    status.textContent = 'Citation copied to clipboard.';
    window.setTimeout(() => { copyButton.textContent = 'Copy citation ⧉'; }, 2200);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('bibtex'));
    selection.removeAllRanges();
    selection.addRange(range);
    copyButton.textContent = 'Citation selected';
    status.textContent = 'Automatic copying was unavailable. The citation is selected for you to copy.';
  }
});
