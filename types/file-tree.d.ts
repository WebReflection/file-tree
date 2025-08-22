export class File extends globalThis.File {
    /** @extends {GlobalFile} */
    constructor(bits: any, name: any, options: any);
}
export class Folder {
    /**
     * @param {string} name
     */
    constructor(name: string);
    /** @type {Item[]} compatibility with Geist UI Tree.Folder props */
    get files(): Item[];
    /** @type {Item[]} a copy ofall items within the folder */
    get items(): Item[];
    /** @type {HTMLUListElement} the UL element where the items are listed */
    get list(): HTMLUListElement;
    /** @type {string} the name of the folder */
    get name(): string;
    /** @type {number} the total amount of bytes within the folder */
    get size(): number;
    /** @type {'folder'} */
    get type(): "folder";
    /**
     * @param  {...(string|Literal|Item)} items
     * @returns
     */
    append(...items: (string | Literal | Item)[]): this;
    /**
     * @param  {...Item} items
     * @returns
     */
    remove(...items: Item[]): this;
    /**
     * @param {Item} item
     * @param {string} [name]
     * @returns {Item | Promise<Item>}
     */
    rename(item: Item, name?: string): Item | Promise<Item>;
    /**
     * @param {File|GlobalFile} file
     * @param {Content|Content[]} content
     * @returns {File|GlobalFile} the new file with the updated content
     */
    update(file: File | {
        new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): globalThis.File;
        prototype: globalThis.File;
    }, content: Content | Content[]): File | {
        new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): globalThis.File;
        prototype: globalThis.File;
    };
    /** @type {Item[]} */
    [_items]: Item[];
    #private;
}
export class Tree extends HTMLElement {
    constructor(data?: {});
    get files(): Item[];
    get items(): Item[];
    get list(): HTMLUListElement;
    get name(): string;
    get size(): number;
    get type(): "folder";
    /** @type {Item|null} the last selected item */
    get selected(): Item | null;
    /**
     * @param  {...(string|Literal|Item)} items
     * @returns
     */
    append(...items: (string | Literal | Item)[]): this;
    /**
     * @param  {...Item} items
     * @returns
     */
    remove(...items: Item[]): this;
    /**
     * @param {Item} item
     * @param {string} [name]
     * @returns
     */
    rename(item: Item, name?: string): Item | Promise<Item>;
    /**
     * @param {File|GlobalFile} file
     * @param {Content|Content[]} content
     * @returns
     */
    update(file: File | {
        new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): globalThis.File;
        prototype: globalThis.File;
    }, content: Content | Content[]): {
        new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): globalThis.File;
        prototype: globalThis.File;
    } | File;
    #private;
}
export type Item = {
    new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): globalThis.File;
    prototype: globalThis.File;
} | File | Folder;
export type Content = string | ArrayBuffer | ArrayBufferView | Blob | File;
export type Literal = LiteralFile | LiteralFolder;
export type LiteralFile = {
    name: string;
    type?: string;
    content?: Content[];
};
export type LiteralFolder = {
    name: string;
    type: "folder";
    items?: Item[];
};
declare const _items: unique symbol;
export {};
