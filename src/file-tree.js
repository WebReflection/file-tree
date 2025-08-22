import {
  bytes,
  createElement,
  customEvent,
  defineProperties,
  duplicated,
  error,
  height,
  is,
  known,
  onEnterKey,
  pair,
  parse,
  path,
  stopImmediatePropagation,
  styleSheet,
} from './utils.js';

/** @typedef {GlobalFile|File|Folder} Item */
/** @typedef {string|ArrayBuffer|ArrayBufferView|Blob|File} Content */
/** @typedef {LiteralFile|LiteralFolder} Literal */
/**
 * @typedef {object} LiteralFile
 * @property {string} name
 * @property {string} [type]
 * @property {Content[]} [content]
 */
/**
 * @typedef {object} LiteralFolder
 * @property {string} name
 * @property {'folder'} type
 * @property {Item[]} [items]
 */

const { at, map, reduce } = Array.prototype;
const { File: GlobalFile } = globalThis;

const bootstrap = event => {
  stopImmediatePropagation(event);
  const { type } = event;
  const li = event.target?.closest('li');
  const button = li?.querySelector('button');
  if (!li || button?.disabled || transitioning) return;
  const target = refs.get(li);
  const folder = is(li, 'folder');
  const action = type === 'click' && folder ? (is(li, 'opened') ? 'close' : 'open') : type;
  return [
    li.closest(':host > ul').parentNode.host,
    li, button, folder,
    customEvent(type, {
      get owner() {
        const folder = li.parentNode.closest('li');
        return folder ? refs.get(folder) : li.closest(':host > ul').parentNode.host;
      },
      originalTarget: li,
      path: path(li),
      action,
      folder,
      target,
    })
  ];
};

const convert = li => {
  const name = li.querySelector('button').textContent.trim();
  if (is(li, 'folder')) {
    const folder = new Folder(name);
    folder.append(...map.call(li.querySelector('ul').children, convert));
    return folder;
  }
  return new File(['\x00'.repeat(+li.dataset.bytes || 0)], name);
};

const copy = (list, item, name) => {
  if (item instanceof Folder) {
    const folder = new Folder(name);
    folder.append(...list);
    return folder;
  }
  return new File([item], name);
};

const count = (curr, li) => (
  curr + 1 + (
    is(li, 'folder') &&
    is(li, 'opened') ?
    nested(li.querySelector('ul')) : 0
  )
);

const get = file => {
  const { name, size, type } = file;
  let li = nodes.get(file);
  if (!li) {
    li = createElement('li', { className: /^text\//.test(type) ? 'text' : 'file' });
    li.appendChild(createElement('button', { textContent: name, onfocus })).dataset.bytes = bytes(+size || 0);
    nodes.set(file, li);
    refs.set(li, file);
  }
  return li;
};

const focused = item => {
  nodes.get(item).querySelector('button').focus();
  return item;
};

const nested = ({ children }) => reduce.call(children, count, 0);

const onfocus = ({ currentTarget }) => {
  selected = refs.get(currentTarget.closest('li'));
};

const ordered = (a, b) => {
  const aFolder = a instanceof Folder;
  const bFolder = b instanceof Folder;
  if (aFolder && !bFolder) return -1;
  if (!aFolder && bFolder) return 1;
  return a.name.localeCompare(b.name);
};

const replace = (oldFile, newFile) => {
  const li = nodes.get(oldFile);
  nodes.delete(oldFile);
  nodes.set(newFile, li);
  refs.set(li, newFile);
  li.querySelector('button').dataset.bytes = bytes(+newFile.size || 0);
  return newFile;
};

const transitionend = event => {
  stopImmediatePropagation(event);
  transitioning = false;
  for (const ul of event.currentTarget.closest(':host > ul').querySelectorAll('ul'))
    ul.style.height = is(ul.parentElement, 'opened') ? 'auto' : '0px';
};

const updateCount = (self, length) => {
  nodes.get(self).querySelector('button').dataset.items = `${length} item${length === 1 ? '' : 's'}`;
};

const interpolateSize = CSS.supports('interpolate-size:allow-keywords');
const css = await styleSheet(import.meta.url.replace(/(\.)?js(\+.+)?$/, '$1css'));
const nodes = new WeakMap;
const refs = new WeakMap;

let transitioning = false;
let selected = null;

export class File extends GlobalFile {
  /** @extends {GlobalFile} */
  constructor(bits, name, options) {
    const details = parse(name);
    get(super([].concat(bits), details.name, { type: details.type, ...options }));
  }
}

export class Folder {
  /** @type {Item[]} */
  #items = [];

  /** @type {string} the name of the folder */
  #name;

  /** @type {HTMLUListElement} */
  #ul;

  /**
   * @param {string} name
   */
  constructor(name) {
    this.#name = encodeURIComponent(name);
    this.#ul = createElement('ul');
    const li = createElement('li', { className: 'folder' });
    li.append(createElement('button', { textContent: name }), this.#ul);
    nodes.set(this, li);
    refs.set(li, this);
  }

  /** @type {Item[]} compatibility with Geist UI Tree.Folder props */
  get files() { return this.items }

  /** @type {Item[]} a copy ofall items within the folder */
  get items() { return this.#items.slice(0) }

  /** @type {HTMLUListElement} the UL element where the items are listed */
  get list() { return this.#ul }

  /** @type {string} the name of the folder */
  get name() { return this.#name }

  /** @type {number} the total amount of bytes within the folder */
  get size() { return this.#items.reduce((acc, file) => acc + file.size, 0) }

  /** @type {'folder'} */
  get type() { return 'folder' }

  /**
   * @param  {...(string|Literal|Item)} items
   * @returns
   */
  append(...items) {
    const list = this.#items;
    for (let file of items) {
      if (typeof file === 'string') {
        // .folder or folder
        if (file.lastIndexOf('.') < 0) {
          file = new Folder(file);
        }
        else {
          file = new File([], file);
        }
      }
      else if (!(file instanceof Folder)) {
        if (Symbol.iterator in file) this.append(...file);
        else if (file instanceof GlobalFile) {
          if (!(file instanceof File))
            file = new File([file], file.name, file);

        }
        // create a file out of an object literal
        else {
          if (file.type === 'folder') {
            const items = file.items ?? file.files;
            file = new Folder(file.name);
            if (items) file.append(...items);
          }
          else file = new File(file.content ?? [], file.name, file);
        }
      }
      if (!list.includes(file)) list.push(file);
      this.#ul.appendChild(get(file));
    }
    const { length } = list;
    updateCount(this, length);
    list.sort(ordered);
    for (let { children } = this.#ul, i = 0; i < length; i++) {
      const item = list[i];
      const li = nodes.get(item);
      if (at.call(children, i) !== li) this.#ul.insertBefore(li, at.call(children, i));
    }
    return this;
  }

  /**
   * @param  {...Item} items
   * @returns
   */
  remove(...items) {
    const list = this.#items;
    for (const item of items) {
      if (selected === item) selected = null;
      const i = list.indexOf(item);
      if (i < 0) error(item, this);
      list.splice(i, 1);
      const li = nodes.get(item);
      nodes.delete(item);
      refs.delete(li);
      li.remove();
      updateCount(this, list.length);
    }
    return this;
  }

  /**
   * @param {Item} item
   * @param {string} [name]
   * @returns {Item | Promise<Item>}
   */
  rename(item, name = '') {
    const list = this.#items;
    if (!list.includes(item)) error(item, this);
    name = name.trim();
    if (name) {
      if (known(list, name)) duplicated(name, this);
      const newItem = copy(list, item, name);
      this.remove(item).append(newItem);
      return focused(newItem);
    }
    else {
      const li = nodes.get(item);
      const button = li.querySelector('button');
      const input = () => {
        li.classList.toggle('error', known(list, button.textContent.trim()));
      };
      name = button.textContent.trim();
      button.addEventListener('click', stopImmediatePropagation);
      button.addEventListener('keydown', onEnterKey);
      button.addEventListener('input', input);
      button.setAttribute('role', 'textbox');
      button.contentEditable = true;
      return new Promise(resolve => {
        button.addEventListener('blur', () => {
          button.removeEventListener('click', stopImmediatePropagation);
          button.removeEventListener('keydown', onEnterKey);
          button.removeEventListener('input', input);
          button.removeAttribute('role');
          button.contentEditable = false;
          const newName = button.textContent.trim();
          if (name === newName) resolve(focused(item));
          else {
            if (known(list, newName)) {
              button.textContent = name;
              duplicated(newName, this);
            }
            const newItem = copy(list, item, newName);
            this.remove(item).append(newItem);
            resolve(focused(newItem));
          }
        }, { once: true });
        button.focus();
      });
    }
  }

  /**
   * @param {File|GlobalFile} file
   * @param {Content|Content[]} content
   * @returns {File|GlobalFile} the new file with the updated content
   */
  update(file, content) {
    const list = this.#items;
    const i = list.indexOf(file);
    if (i < 0) error(file, this);
    return (list[i] = replace(file, new File(content, file.name, file)));
  }
}

export class Tree extends HTMLElement {
  #root;

  constructor(data = {}) {
    const prev = super().querySelector('ul');
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const { list } = (this.#root = new Folder('#root'));
    shadowRoot.adoptedStyleSheets.push(css);
    if (prev) {
      prev.remove();
      for (const { name, value } of prev.attributes) list.setAttribute(name, value);
      this.append(...map.call(prev.children, convert));
    }
    list.addEventListener('click', click);
    list.addEventListener('contextmenu', contextmenu);
    shadowRoot.replaceChildren(list);
    if (data) {
      // TODO: parse data to create a tree structure
    }
  }

  get files() { return this.#root.files }
  get items() { return this.#root.items }
  get list() { return this.#root.list }
  get name() { return '#root' }
  get size() { return this.#root.size }
  get type() { return this.#root.type }

  /** @type {Item|null} the last selected item */
  get selected() { return selected }

  /**
   * @param  {...(string|Literal|Item)} items
   * @returns
   */
  append(...items) {
    this.#root.append(...items);
    return this;
  }

  /**
   * @param {string} path
   * @returns {Item[]?}
   */
  query(path) {
    const chunks = [];
    let { items } = this, item;
    for (const name of path.split('/')) {
      item = items.find(i => i.name === name);
      if (!item) return null;
      if (item instanceof Folder) ({ items } = item);
      chunks.push(item);
    }
    return chunks;
  }

  /**
   * @param  {...Item} items
   * @returns
   */
  remove(...items) {
    let owner = this.#root, item;
    if (items.length === 1 && typeof items[0] === 'string') {
      const chunks = this.query(items[0]);
      if (!chunks) error({ name: items[0] }, this);
      [owner, item] = pair(owner, chunks);
      items = [item];
    }
    owner.remove(...items);
    return this;
  }

  /**
   * @param {string|Item} item
   * @param {string} [name]
   * @returns
   */
  rename(item, name = '') {
    let owner = this.#root;
    if (typeof item === 'string') {
      const chunks = this.query(item);
      if (!chunks) error({ name: item }, this);
      [owner, item] = pair(owner, chunks);
    }
    return owner.rename(item, name);
  }

  /**
   * @param {string|File|GlobalFile} file
   * @param {Content|Content[]} content
   * @returns
   */
  update(file, content) {
    let owner = this.#root;
    if (typeof file === 'string') {
      const chunks = this.query(file);
      if (!chunks) error({ name: file }, this);
      [owner, file] = pair(owner, chunks);
    }
    return owner.update(file, content);
  }
}

customElements.define('file-tree', Tree);

/**
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function click(event) {
  event.preventDefault();
  const details = bootstrap(event);
  if (!details) return;
  const [host, li, button, folder, customEvent] = details;
  host.dispatchEvent(customEvent);
  if (customEvent.defaultPrevented) return;
  if (customEvent.async) {
    li.classList.add('waiting');
    li.classList.remove('error');
    try { await customEvent }
    catch {
      li.classList.add('error');
      return;
    }
    finally { li.classList.remove('waiting') }
  }
  if (folder) {
    if (!interpolateSize) {
      transitioning = true;
      const opened = is(li, 'opened');
      const ul = li.querySelector('ul');
      ul.addEventListener('transitionend', transitionend);
      ul.animate([
        { height: opened ? height(ul) : 0 },
        { height: opened ? 0 : `${parseFloat(height(li)) * nested(ul)}px` },
      ], {
        iterations: 1,
        duration: 200,
        easing: 'ease',
      });
    }
    li.classList.toggle('opened');
  }
  if (button !== document.activeElement) button.focus();
}

function contextmenu(event) {
  const details = bootstrap(event);
  if (details) {
    details[0].dispatchEvent(defineProperties(details.pop(), {
      preventDefault: { value: () => event.preventDefault() },
    }));
  }
}
