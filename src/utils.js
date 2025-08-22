import mime from './mime.js';

const { floor, log, pow } = Math;
const { assign, defineProperties } = Object;

export const bytes = (bytes, decimals = 2) => {
  let i = 0;
  if (bytes) {
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    i = floor(log(bytes) / log(k));
    bytes = (bytes / pow(k, i)).toFixed(dm);
  }
  return `${bytes} ${['bytes', 'kB', 'mB', 'gB', 'tB', 'pB', 'eB', 'zB', 'yB'][i]}`;
};

export const createElement = (tag, stuff) => assign(document.createElement(tag), stuff);

export const customEvent = (type, detail, promise = null) => defineProperties(
  new CustomEvent(type, {
    detail,
    bubbles: true,
    cancelable: true,
  }),
  {
    waitUntil: { value: (...args) => { [promise] = args } },
    then: { value: (...args) => promise?.then(...args) },
    async: { get: () => !!promise },
  }
);

export { defineProperties };

export const duplicated = (name, folder) => {
  throw new Error(`Item ${name} already exists in folder ${folder.name}`);
};

export const error = (item, folder) => {
  throw new Error(`Item ${item.name} not found in folder ${folder.name}`);
};

export const height = el => getComputedStyle(el).height;

export const is = (el, kind) => !!el?.classList?.contains?.(kind);

export const known = (list, name) => list.some(i => i.name === name);

export const onEnterKey = event => {
  if (event.key === 'Enter') {
    event.currentTarget.blur();
  }
};

export const parse = name => {
  const dot = name.lastIndexOf('.');
  const ext = name.slice(dot);
  return {
    name: dot < 0 ? encodeURIComponent(name) : (encodeURIComponent(name.slice(0, dot)) + ext),
    type: mime[ext] ?? 'text/plain'
  };
};

export const path = li => {
  const chunks = [li.querySelector('button').textContent];
  while (li = li.parentNode?.closest('li'))
    chunks.unshift(li.querySelector('button').textContent);
  return chunks.join('/');
};

export const stopImmediatePropagation = event => {
  event.stopImmediatePropagation();
};

export const styleSheet = async url => {
  try {
    return (await import(url, { with: { type: 'css' } })).default;
  }
  catch {
    const styleSheet = new CSSStyleSheet;
    await styleSheet.replace(await fetch(url).then(r => r.text()));
    return styleSheet;
  }
};
