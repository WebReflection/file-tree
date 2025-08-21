# @webreflection/file-tree

A file tree component for the web.

### Tree

The `<file-tree />` *custom element*, able to bootstrap from existent content or create procedurally any *tree*.

```js
import { Tree, Folder, File } from 'https://esm.run/@webreflection/file-tree/prod.js';

const tree = new Tree;

// add an empty text file
tree.append(new File([], 'test.txt'));

// will provide details once an Item is clicked
tree.onclick = (event) => {};
```

Each *Tree* implements the whole *Folder* intrface plus a `selected` accessor that returns the last *item* that was selected on such tree.

#### Tree Click Event

When an *item* is clicked, the optional *click* event handler will be dispatched via `CustomEvent` and its `detail` property:

  * `action: "open" | "close" | "click"` where `open` or `close` are *folders* only while `click` is for files.
  * `folder: boolean` indicating if the *item* is a folder.
  * `path: string` to retrieve the whole path in *Web compat* format, such as: `some/path/file.txt`.
  * `target: File | Folder` which is the related *file* or *folder* reference that was clicked.

If the *listener* invokes `event.preventDefault()` the logic won't do anything else.

If the *listener* invokes `event.waitUntil(Promise<unknown>):void`, needed to fetch the *folder* or *file* content asynchronously, as example, the *UI* will hint something is waiting to happen and it will finish once that promise has been resolved.

### Folder

The abstract interface that can be directly or lazily expanded.

```js
import { Tree, Folder, File } from 'https://esm.run/@webreflection/file-tree/prod.js';

const tree = new Tree;
const assets = new Folder('assets');
const src = new Folder('src');

tree.append(assets, src);
src.append(new File([], 'main.js'));
```

A *Folder* provides the following accessors:

  * `items`, aliased as `files`, to retrieve all *items* (that is either *File* or *Folder*) contained in it.
  * `list` (mostly internal usage) to retrieve the *HTMLUnorderedList* element that is hosting *items* elements.
  * `name` which is the associated name to this folder.
  * `size` which is the sum of all items in terms of bytes.
  * `type` which is exactly the string `"folder"`, there to simplify brand-checking against files.

A *Folder* also provides the following utilities:

  * `append(...items: (string | object | Item)[]): this` to add one or more *item* to the folder. Strings are converted as empty files or folders, if no extension is provided, objects can have `type`, `name` and `content`.
  * `remove(...items: Item[]): this` to remove one or more *Item* from the folder.
  * `rename(item: Item, name?: string): Item | Promise<Item>` to change the name of a specific *Item* (that is either *File* or *Folder*). If no `name` is provided, the *UI* will focus the item as `contentEditable` and it will resolve the returned promise once *Enter* key or *blur* event hapens.
  * `update(file: File, content: Content | Content[]): File` to change the content of a specific file. 

Please note that everything is immutable in here, so that new folders or files need to be created in both `rename` and `update` operations, as it's not possible to change `name` or `content` at runtime with native `globalThis.File` interface, so that both methods return the *newly* created *Item* reference.

### File

This utility is an extend of `globalThis.File` with an automatic `type` inference that can be overridden if explicitly passed as `options` field.

```js
import { Tree, Folder, File } from 'https://esm.run/@webreflection/file-tree/prod.js';

// type: text/plain
const txt = new File(['hello world'], 'hello.txt');

// type: application/octet-stream
const bin = new File(['hello world'], 'hello.txt', { type: 'application/octet-stream' });
```

The other convenient utility backed into its constructor is sanitization of the *name* in a *Web compatible way*.

Native, plain, *File* reference can also be passed directly to all methods but their *name* will be sanitized and their reference, but not their content, will be discarded.
