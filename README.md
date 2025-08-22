# @webreflection/file-tree

A modern, lightweight file tree component for the web, inspired by Geist UI File-Tree and [its icons](https://www.npmjs.com/package/@geist-ui/icons). Built as a custom element with TypeScript support.

## Features

- 🌳 **Custom Element**: Drop-in `<file-tree>` component
- 📁 **Hierarchical Structure**: Support for nested folders and files
- 🎯 **Interactive**: Click, right-click, and keyboard navigation
- 🔄 **Async Support**: Built-in loading states for dynamic content
- 📦 **Zero Dependencies**: Pure vanilla JavaScript
- 🔧 **TypeScript Ready**: Full type definitions included

**[Live Demo](https://webreflection.github.io/file-tree/test/)**

```js
import { Tree, Folder, File } from 'https://cdn.jsdelivr.net/npm/@webreflection/file-tree/prod.js';

const tree = new Tree;

// add an empty text file
tree.append(new File([], 'test.txt'));

// will provide details once an Item is clicked
tree.onclick = (event) => {};
// will provide details once an Item is right-clicked
tree.oncontextmenu = (event) => {};
```

Each *Tree* implements the whole *Folder* interface plus a `selected` accessor that returns the last *item* that was selected on such tree and a `query(path: string): Item[] | null` utility to retrieve all items up to the target as a flat list or `null`, if no path is found.

As extra feature, *Tree* methods such as `update`, `rename` and `remove` allow passing a path instead of an item to simplify nested tree handling via strings.

#### Tree Click or ContextMenu Event

When an *item* is clicked, or right-clicked, the optional *click* / *contextmenu* event handler will be dispatched via `CustomEvent` and its `detail` property:

  * `action: "open" | "close" | "click"` where `open` or `close` are *folders* only while `click` is for files.
  * `folder: boolean` indicating if the *item* is a folder.
  * `originalTarget` which is the `<li>` element representing the *target* *File* or *Folder*
  * `owner` which is the parent folder needed to operate with the *target* (remove, rename, update).
  * `path: string` to retrieve the whole path in *Web compat* format, such as: `some/path/file.txt`.
  * `target: File | Folder` which is the related *file* or *folder* reference that was clicked.

If the *listener* invokes `event.preventDefault()` the logic won't do anything else or, in the `contextmenu` case, it will prevent the default menu from appearing.

If the *click* *listener* invokes `event.waitUntil(Promise<unknown>):void`, needed to fetch the *folder* or *file* content asynchronously, as example, the *UI* will hint something is waiting to happen and it will finish once that promise has been resolved.

### Folder

The abstract interface that can be directly or lazily expanded.

```js
import { Tree, Folder, File } from 'https://cdn.jsdelivr.net/npm/@webreflection/file-tree/prod.js';

const tree = new Tree;
const assets = new Folder('assets');
const src = new Folder('src');

tree.append(assets, src);
src.append(new File([], 'main.js'));
```

## API Reference

### Tree

The main file tree component that extends `HTMLElement` and implements the `Folder` interface.

#### Properties

- `selected: Item | null` - Returns the last selected item
- `items: Item[]` - All items in the tree (alias: `files`)

#### Methods

- `append(...items: (string | object | Item)[]): this` - Add items to the tree
- `remove(...items: Item[]): this` - Remove items from the tree
- `rename(item: Item, name?: string): Item | Promise<Item>` - Rename an item
- `update(file: File, content: Content | Content[]): File` - Update file content
- `query(path: string): Item[] | null` - Get items by path

#### Events

```javascript
tree.addEventListener('click', (event) => {
  const { action, folder, originalTarget, owner, path, target } = event.detail;
  
  if (action === 'open' && folder) {
    // Handle folder opening
    event.waitUntil(loadFolderContent(target));
  } else if (action === 'click' && !folder) {
    // Handle file click
    console.log('File clicked:', path);
  }
});

tree.addEventListener('contextmenu', (event) => {
  const { action, folder, path, target } = event.detail;
  
  // Show custom context menu
  showContextMenu(event, target);
  event.preventDefault(); // Prevent default browser menu
});
```

### Folder

Represents a directory in the file tree.

#### Properties

- `name: string` - Folder name
- `type: "folder"` - Always returns "folder"
- `size: number` - Total size of all items in bytes
- `items: Item[]` - All items in the folder (alias: `files`)

#### Methods

- `append(...items: (string | object | Item)[]): this` - Add items
- `remove(...items: Item[]): this` - Remove items
- `rename(item: Item, name?: string): Item | Promise<Item>` - Rename an item
- `update(file: File, content: Content | Content[]): File` - Update file content

### File

Extends the native `File` class with additional utilities.

#### Constructor

```javascript
new File(content, name, options?)
```

- `content: Content | Content[]` - File content
- `name: string` - File name (automatically sanitized)
- `options?: { type?: string }` - Optional type override

#### Example

```javascript
// Text file (type inferred from extension)
const readme = new File(['# My Project'], 'README.md');

// Binary file with explicit type
const image = new File([''], 'logo.png', { type: 'image/png' });

// Custom type
const config = new File(['{"key": "value"}'], 'config.json', { 
  type: 'application/json' 
});
```

## Event Details

When items are clicked or right-clicked, a `CustomEvent` is dispatched with the following detail properties:

| Property | Type | Description |
|----------|------|-------------|
| `action` | `"open" \| "close" \| "click"` | Action performed (`open`/`close` for folders, `click` for files) |
| `folder` | `boolean` | Whether the item is a folder |
| `originalTarget` | `HTMLLIElement` | The `<li>` element representing the item |
| `owner` | `Folder` | Parent folder containing the item |
| `path` | `string` | Full path in web-compatible format (e.g., `src/components/Button.jsx`) |
| `target` | `File \| Folder` | The actual file or folder object |

### Async Operations

Use `event.waitUntil()` for asynchronous operations:

```javascript
tree.addEventListener('click', (event) => {
  const { action, folder, target } = event.detail;
  
  if (action === 'open' && folder) {
    // Load folder content asynchronously
    event.waitUntil(
      fetchFolderContent(target.name).then(content => {
        content.forEach(item => target.append(item));
      })
    );
  }
});
```

## Examples

### Dynamic File Loading

```javascript
tree.addEventListener('click', async (event) => {
  const { action, folder, target } = event.detail;
  
  if (action === 'open' && folder) {
    event.waitUntil(
      fetch(`/api/files/${target.name}`)
        .then(response => response.json())
        .then(files => {
          files.forEach(file => {
            if (file.type === 'folder') {
              target.append(new Folder(file.name));
            } else {
              target.append(new File([file.content], file.name, { 
                type: file.mimeType 
              }));
            }
          });
        })
    );
  }
});
```

### Tree File Operations

```javascript
// Rename a file and get the new one
const renamedFile = tree.rename('src/main.js', 'app.js');

// Update file content and get the new file
const updatedFile = tree.update('src/app.js', ['console.log("Updated!")']);

// Remove a folder or file
tree.remove('src/components');
```

### Bootstrap from HTML

```html
<file-tree>
  <ul>
    <li class="file" data-bytes="1024">
      <button>package.json</button>
    </li>
    <li class="folder">
      <button>src</button>
      <ul>
        <li class="file" data-type="text/javascript">
          <button>index.js</button>
        </li>
        <li class="folder opened">
          <button>components</button>
          <ul>
            <li class="file">
              <button>Button.jsx</button>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</file-tree>
```

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 11.1+
- Edge 79+

## License

Geist UI Icons are under MIT license, here slightly modified for this project purpose.

Everything else is under MIT © [Andrea Giammarchi](https://github.com/WebReflection).
