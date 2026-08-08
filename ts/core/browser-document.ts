import { getLogger } from '@node-3d/addon-tools';
import { Image } from '@node-3d/image';
import { glfw } from '@node-3d/glfw';
import { webgl } from '@node-3d/webgl';
import type { TCbVoid, TSize, TWindowOpts } from '@node-3d/glfw';
import { BrowserWindow } from './browser-window.ts';

const logger = getLogger('core');
const ESC_KEY = 27;
const F_KEY = 70;

type TShortcutKeyEvent = Readonly<{
	code: string | null;
	key: string | null;
	keyCode?: unknown;
}>;

const isEscapeKey = (event: TShortcutKeyEvent): boolean =>
	event.key === 'Escape' || event.code === 'Escape' || event.keyCode === ESC_KEY;

const isFKey = (event: TShortcutKeyEvent): boolean =>
	event.key === 'f' || event.key === 'F' || event.code === 'KeyF' || event.keyCode === F_KEY;

export type TBrowserDocumentOpts = TWindowOpts &
	Readonly<
		Partial<{
			/**
			 * Whether the window should ignore default quit signals.
			 *
			 * Examples: process `SIGINT`, document `quit`, and ESC press if `autoEsc` is enabled.
			 */
			ignoreQuit: boolean;
			/**
			 * Whether the window has default fullscreen key handlers.
			 *
			 * * CTRL+F - borderless fullscreen window.
			 * * CTRL+ALT+F - real, exclusive fullscreen mode.
			 * * CTRL+SHIFT+F - back to windowed.
			 */
			autoFullscreen: boolean;
			/**
			 * Handle ESC key to close the window automatically.
			 *
			 * Does nothing if `ignoreQuit` is enabled.
			 */
			autoEsc: boolean;
		}>
	>;

type TMutableWebgl = typeof webgl & {
	canvas?: BrowserDocument;
	init?: TCbVoid;
	data?: unknown;
};

type TCanvasStub = Readonly<{
	width: number;
	height: number;
	getContext: (kind: string) => TMutableWebgl | InstanceType<typeof Image> | null;
	readonly data: unknown;
	onkeydown: TCbVoid;
	onkeyup: TCbVoid;
	onmousedown: TCbVoid;
	onmouseup: TCbVoid;
	onwheel: TCbVoid;
	onmousewheel: TCbVoid;
	onresize: TCbVoid;
	dispatchEvent: TCbVoid;
	addEventListener: TCbVoid;
	removeEventListener: TCbVoid;
}>;

const emptyFunction = (): void => {
	/* nop */
};

const mutableWebgl = webgl as TMutableWebgl;
let isWebglInited = false;

/**
 * Browser-style document/canvas compatibility layer.
 *
 * A BrowserDocument is also the main BrowserWindow and canvas. It intentionally
 * implements only the DOM surface that renderers commonly need in Node3D.
 */
export class BrowserDocument extends BrowserWindow {
	private _isCanvasRequested: boolean;

	public constructor(opts: TBrowserDocumentOpts = {}) {
		super(opts);
		this._isCanvasRequested = false;

		if (!isWebglInited) {
			try {
				if (typeof mutableWebgl.init === 'function') {
					mutableWebgl.init();
				}
			} catch {
				logger.warn('WebGL `init()` call failed, but it may still work.');
			}
			isWebglInited = true;
		}
		mutableWebgl.canvas = this;

		this.on('mousedown', (e) => {
			this.emit('pointerdown', e);
		});
		this.on('mouseup', (e) => {
			this.emit('pointerup', e);
		});
		this.on('mousemove', (e) => {
			this.emit('pointermove', e);
		});

		if (!opts.ignoreQuit) {
			const isUnix = process.platform !== 'win32';
			if (isUnix && !process.listeners('SIGINT').includes(BrowserDocument.exit)) {
				process.on('SIGINT', BrowserDocument.exit);
			}

			this.on('quit', () => BrowserWindow.exit());

			if (opts.autoEsc) {
				this.on('keydown', (e) => {
					if (isEscapeKey(e)) {
						BrowserWindow.exit();
					}
				});
			}
		}

		if (opts.autoFullscreen) {
			this.on('keydown', (e) => {
				if (!isFKey(e)) {
					return;
				}

				if (e.ctrlKey && e.shiftKey) {
					this.mode = 'windowed';
				} else if (e.ctrlKey && e.altKey) {
					this.mode = 'fullscreen';
				} else if (e.ctrlKey) {
					this.mode = 'borderless';
				}
			});
		}
	}

	/** Set `glfw.CURSOR` mode to `glfw.CURSOR_DISABLED`. */
	public setPointerCapture = (): void => {
		this.setInputMode(glfw.CURSOR, glfw.CURSOR_DISABLED);
	};

	/** Set `glfw.CURSOR` mode to `glfw.CURSOR_NORMAL`. */
	public releasePointerCapture = (): void => {
		this.setInputMode(glfw.CURSOR, glfw.CURSOR_NORMAL);
	};

	public makeCurrent(): void {
		mutableWebgl.canvas = this;
		super.makeCurrent();
	}

	/** Returns `this`. */
	public get body(): BrowserDocument {
		return this;
	}

	/**
	 * Mimics the web element `style` property.
	 *
	 * Only `width` and `height` matter.
	 */
	public get style(): TSize {
		const getWidth = (): number => this.innerWidth;
		const setWidth = (value: string): void => {
			this.width = Number.parseInt(value, 10) * this.devicePixelRatio;
		};
		const getHeight = (): number => this.innerHeight;
		const setHeight = (value: string): void => {
			this.height = Number.parseInt(value, 10) * this.devicePixelRatio;
		};

		return {
			get width(): number {
				return getWidth();
			},
			set width(value: string) {
				setWidth(value);
			},
			get height(): number {
				return getHeight();
			},
			set height(value: string) {
				setHeight(value);
			},
		};
	}

	/** Returns the core WebGL implementation. */
	public get context(): TMutableWebgl {
		return mutableWebgl;
	}

	/** Returns the core WebGL implementation, or an Image-backed 2D placeholder. */
	public getContext(kind: string): TMutableWebgl | InstanceType<typeof Image> | null {
		return kind === '2d' ? new Image() : mutableWebgl;
	}

	/** Returns `this`. */
	public getRootNode(): BrowserDocument {
		return this;
	}

	/** Returns `this`. */
	public getElementById(): BrowserDocument {
		return this;
	}

	/** Returns `this`. */
	public querySelector(): BrowserDocument {
		return this;
	}

	/** Returns an array containing `this`. */
	public querySelectorAll(): readonly BrowserDocument[] {
		return [this];
	}

	/** Returns an array containing `this`. */
	public getElementsByTagName(): readonly BrowserDocument[] {
		return [this];
	}

	/** Returns whether `node` is this document. */
	public contains(node: unknown): boolean {
		return node === this;
	}

	/** Does nothing. */
	public appendChild(): void {
		/* nop */
	}

	/** Does nothing. */
	public append(): void {
		/* nop */
	}

	/** Returns the result of `createElement(name)`. */
	public createElementNS(
		_0: unknown,
		name: string,
	): BrowserDocument | InstanceType<typeof Image> | TCanvasStub | null {
		return this.createElement(name);
	}

	/**
	 * Fake `createElement`.
	 *
	 * For `canvas`, returns `this` on the first call, then returns canvas-like
	 * objects capable of using 2D or 3D context. This supports web APIs like
	 * three.js, which create additional canvases.
	 *
	 * For `img`, returns `new Image()`.
	 */
	public createElement(
		nameRaw: string,
	): BrowserDocument | InstanceType<typeof Image> | TCanvasStub | null {
		const name = nameRaw.toLowerCase();

		if (name.includes('img')) {
			return new Image();
		}

		if (name.includes('canvas')) {
			if (!this._isCanvasRequested) {
				this._isCanvasRequested = true;
				return this;
			}

			const getContext = (kind: string): TMutableWebgl | InstanceType<typeof Image> | null =>
				this.getContext(kind);
			let ctx: TMutableWebgl | InstanceType<typeof Image> | null = null;

			return {
				width: this.width,
				height: this.height,

				getContext(kind) {
					ctx = getContext(kind);
					return ctx;
				},

				get data() {
					return ctx && 'data' in ctx ? ctx.data : undefined;
				},

				onkeydown: emptyFunction,
				onkeyup: emptyFunction,
				onmousedown: emptyFunction,
				onmouseup: emptyFunction,
				onwheel: emptyFunction,
				onmousewheel: emptyFunction,
				onresize: emptyFunction,

				dispatchEvent: emptyFunction,
				addEventListener: emptyFunction,
				removeEventListener: emptyFunction,
			};
		}

		return null;
	}
}

global.HTMLCanvasElement = BrowserDocument as unknown as typeof global.HTMLCanvasElement;
global.HTMLImageElement = Image as unknown as typeof global.HTMLImageElement;
