import EventEmitter from 'node:events';
import type * as THREE from 'three';
import type {
	TDocument,
	TIcon,
	TImageConstructor,
	TMutableWebgl,
	TNode3DGlobal,
	TResizeEvent,
	TThree,
	TWebgl,
} from '../types.ts';

const DEFAULT_FOV = 90;
const DEFAULT_NEAR = 0.2;
const DEFAULT_FAR = 400;

const GL_POINT_SPRITE = 0x8861;
const GL_VERTEX_PROGRAM_POINT_SIZE = 0x8642;
const GL_COORD_REPLACE = 0x8862;

export type TScreenOpts = Readonly<{
	three?: unknown;
	THREE?: unknown;
	gl?: unknown;
	doc?: unknown;
	document?: unknown;
	Image?: unknown;
	title?: string;
	camera?: unknown;
	scene?: unknown;
	renderer?: unknown;
	fov?: number;
	near?: number;
	far?: number;
	z?: number;
}>;

type TScreenCamera = THREE.Camera & {
	fov: number;
	aspect: number;
	updateProjectionMatrix: () => void;
};

type TRendererWithLegacyDebug = THREE.WebGLRenderer & {
	debug_checkShaderErrors?: boolean;
	debug_onShaderError?: unknown;
};

type TDeepObject = Record<string, unknown>;
type TScreenImplementations = Readonly<{
	three: TThree;
	gl: TWebgl;
	doc: TDocument;
	Image: TImageConstructor;
}>;

export class Screen extends EventEmitter {
	private _three: TThree;
	private _gl: TWebgl;
	private _doc: TDocument;
	private _Image: TImageConstructor;
	private _camera: TScreenCamera;
	private _scene: THREE.Scene;
	private _renderer!: THREE.WebGLRenderer;
	private _autoRenderer = false;

	public constructor(opts: TScreenOpts = {}) {
		super();

		const { three, gl, doc, Image } = Screen.resolveImplementations(opts);
		this._three = three;
		this._gl = gl;
		this._doc = doc;
		this._Image = Image;

		if (opts.title) {
			this.title = opts.title;
		}

		this._camera = this._createCamera(opts);
		this._scene = (opts.scene as THREE.Scene) ?? new this._three.Scene();

		if (opts.renderer) {
			this._autoRenderer = false;
			this._renderer = opts.renderer as THREE.WebGLRenderer;
		}
		this._reinitRenderer();

		this._renderer.setSize(this._doc.width, this._doc.height, false);
		this._bindDocumentEvents();
		this._bindEvents();

		this.draw();
	}

	public get context(): TWebgl {
		return this._gl;
	}
	public get three(): TThree {
		return this._three;
	}

	public get renderer(): THREE.WebGLRenderer {
		return this._renderer;
	}
	public get scene(): THREE.Scene {
		return this._scene;
	}
	public get camera(): TScreenCamera {
		return this._camera;
	}

	public get document(): TDocument {
		return this._doc;
	}
	public get canvas(): TDocument {
		return this._doc;
	}

	public get width(): number {
		return this._doc.width;
	}
	public get height(): number {
		return this._doc.height;
	}
	public get w(): number {
		return this._doc.width;
	}
	public get h(): number {
		return this._doc.height;
	}
	public get size(): THREE.Vector2 {
		return new this._three.Vector2(this.w, this.h);
	}

	public get title(): string {
		return this._doc.title;
	}
	public set title(value: string) {
		this._doc.title = value || 'Untitled';
	}

	public get icon(): TIcon {
		return this._doc.icon;
	}
	public set icon(value: TIcon) {
		this._doc.icon = value || null;
	}

	public get fov(): number {
		return this._camera.fov;
	}
	public set fov(value: number) {
		this._camera.fov = value;
		this._camera.updateProjectionMatrix();
	}

	public get mode(): TDocument['mode'] {
		return this._doc.mode;
	}
	public set mode(value: TDocument['mode']) {
		this._doc.mode = value;
	}

	public draw(): void {
		this._renderer.render(this._scene, this._camera);
	}

	public snapshot(name = `${Date.now()}.jpg`): void {
		const memSize = this.w * this.h * 4;
		const storage = { data: Buffer.allocUnsafeSlow(memSize) };

		this._gl.readPixels(0, 0, this.w, this.h, this._gl.RGBA, this._gl.UNSIGNED_BYTE, storage);

		const img = this._Image.fromPixels(this.w, this.h, 32, storage.data);
		img.save(name);
	}

	public static deepAssign(src: TDeepObject, dest: TDeepObject): void {
		for (const [key, value] of Object.entries(src)) {
			if (value && typeof value === 'object') {
				Screen.deepAssign(value as TDeepObject, dest[key] as TDeepObject);
				continue;
			}
			dest[key] = value;
		}
	}

	public _bindEvents(): void {
		for (const type of [
			'keydown',
			'keyup',
			'mousedown',
			'mouseup',
			'mousemove',
			'mousewheel',
		]) {
			this._doc.on(type, (event: unknown) => this.emit(type, event));
		}
	}

	// When switching from fullscreen and back, reset renderer to update VAO/FBO objects.
	public _reinitRenderer(): void {
		const old = this._renderer as TRendererWithLegacyDebug | undefined;

		const renderProps = old
			? {
					shadowMap: {
						enabled: old.shadowMap.enabled,
						type: old.shadowMap.type,
					},
					debug: {
						checkShaderErrors: old.debug_checkShaderErrors,
						onShaderError: old.debug_onShaderError,
					},
					autoClear: old.autoClear,
					autoClearColor: old.autoClearColor,
					autoClearDepth: old.autoClearDepth,
					autoClearStencil: old.autoClearStencil,
					clippingPlanes: old.clippingPlanes,
					outputColorSpace: old.outputColorSpace,
					sortObjects: old.sortObjects,
					toneMapping: old.toneMapping,
					toneMappingExposure: old.toneMappingExposure,
					transmissionResolutionScale: old.transmissionResolutionScale,
				}
			: null;

		if (this._autoRenderer && old) {
			old.dispose();
		}

		this._autoRenderer = true;
		this._renderer = new this._three.WebGLRenderer({
			context: this._gl as unknown as WebGLRenderingContext,
			canvas: this.canvas as unknown as HTMLCanvasElement,
		});

		this._camera.aspect = this.w / this.h;
		this._camera.updateProjectionMatrix();
		this._renderer.setSize(this.w, this.h, false);

		if (renderProps) {
			Screen.deepAssign(renderProps, this._renderer as unknown as TDeepObject);
		}

		const gl = this._gl as TMutableWebgl;
		gl.enable(GL_POINT_SPRITE);
		gl.enable(GL_VERTEX_PROGRAM_POINT_SIZE);
		gl.enable(GL_COORD_REPLACE);
	}

	private static resolveImplementations(opts: TScreenOpts): TScreenImplementations {
		const nodeGlobal = globalThis as unknown as TNode3DGlobal;
		const three = ((opts.three ?? opts.THREE) as TThree) ?? nodeGlobal.THREE;
		const gl = (opts.gl as TWebgl) ?? nodeGlobal['_gl'];
		const doc = ((opts.doc ?? opts.document) as TDocument) ?? nodeGlobal.document;
		const Image = (opts.Image as unknown as TImageConstructor) ?? nodeGlobal.Image;

		if (!three || !gl || !doc || !Image) {
			throw new Error('Screen requires three, webgl, document, and Image implementations.');
		}

		return { three, gl, doc, Image };
	}

	private _createCamera(opts: TScreenOpts): TScreenCamera {
		if (opts.camera) {
			return opts.camera as TScreenCamera;
		}

		const { fov, near, far, z } = opts;
		if (fov === 0) {
			const camera = new this._three.OrthographicCamera(
				-this.w * 0.5,
				this.w * 0.5,
				this.h * 0.5,
				-this.h * 0.5,
				near ?? -10,
				far ?? 10,
			) as unknown as TScreenCamera;
			camera.position.z = z ?? 5;
			return camera;
		}

		const camera = new this._three.PerspectiveCamera(
			fov ?? DEFAULT_FOV,
			this.w / this.h,
			near ?? DEFAULT_NEAR,
			far ?? DEFAULT_FAR,
		) as TScreenCamera;
		camera.position.z = z ?? 10;
		return camera;
	}

	private _bindDocumentEvents(): void {
		this._doc.on('mode', (event: unknown) => {
			this._reinitRenderer();
			this.emit('mode', event);
		});

		this._doc.on('resize', ({ width, height }: TResizeEvent) => {
			const width16 = Math.max(16, width);
			const height16 = Math.max(16, height);

			this._camera.aspect = width16 / height16;
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(width16, height16, false);

			this.emit('resize', { width, height });
		});
	}
}
