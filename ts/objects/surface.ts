import EventEmitter from 'node:events';
import type * as THREE from 'three';
import { Rect } from './rect.ts';
import type { TRectOpts } from './rect.ts';
import { Vec2 } from '../math/vec2.ts';
import type { TDocument, TWebgl, TVec2Source } from '../types.ts';

const DEFAULT_SIZE = 600;
const DEFAULT_FOV = 90;
const DEFAULT_NEAR = 0.2;
const DEFAULT_FAR = 400;

export type TSurfaceOpts = TRectOpts & {
	camera?: THREE.PerspectiveCamera;
	scene?: THREE.Scene;
};

export class Surface extends Rect {
	private _events: EventEmitter;
	private _camera: THREE.PerspectiveCamera;
	private _scene: THREE.Scene;
	private _target: THREE.WebGLRenderTarget;

	public constructor(opts: TSurfaceOpts) {
		const vecSize =
			opts.size === undefined ? new Vec2(DEFAULT_SIZE, DEFAULT_SIZE) : new Vec2(opts.size);
		const sizeOffs = vecSize.scale(-0.5);
		const surfaceOpts: TSurfaceOpts = {
			...opts,
			pos: opts.pos ?? sizeOffs,
			size: vecSize,
		};

		super(surfaceOpts);

		this._events = new EventEmitter();

		if (opts.camera) {
			this._camera = opts.camera;
		} else {
			this._camera = new this.screen.three.PerspectiveCamera(
				DEFAULT_FOV,
				this.width / this.height,
				DEFAULT_NEAR,
				DEFAULT_FAR,
			);
			this._camera.position.z = 10;
		}

		this._scene = opts.scene ?? new this.screen.three.Scene();
		this._target = this._newTarget();
		this.draw();

		this.mesh.material = new this.screen.three.ShaderMaterial({
			side: this.screen.three.DoubleSide,
			uniforms: { t: { value: this._target.texture } },
			vertexShader: `
				varying vec2 tc;
				void main() {
					tc = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}
			`,
			fragmentShader: `
				varying vec2 tc;
				uniform sampler2D t;
				void main() {
					gl_FragColor = texture2D(t, tc);
				}
			`,
			depthWrite: true,
			depthTest: true,
			transparent: true,
		});

		this.mesh.onBeforeRender = () => {
			setTimeout(() => this.draw(), 0);
		};

		this.mesh.geometry.computeBoundingSphere = () => {
			this.mesh.geometry.boundingSphere = new this.screen.three.Sphere(undefined, Infinity);
		};
		this.mesh.geometry.computeBoundingSphere();

		this.mesh.geometry.computeBoundingBox = () => {
			this.mesh.geometry.boundingBox = new this.screen.three.Box3();
		};
		this.mesh.geometry.computeBoundingBox();

		this.mesh.material.needsUpdate = true;
	}

	public on(event: string, cb: (...args: unknown[]) => void): void {
		if (event === 'resize') {
			this._events.on(event, cb);
			return;
		}
		this.screen.on(event, cb);
	}

	public get canvas(): TDocument {
		return this.screen.canvas;
	}
	public get camera(): THREE.PerspectiveCamera {
		return this._camera;
	}
	public get scene(): THREE.Scene {
		return this._scene;
	}
	public get renderer(): THREE.WebGLRenderer {
		return this.screen.renderer;
	}
	public get context(): TWebgl {
		return this.screen.context;
	}
	public get document(): TDocument {
		return this.screen.document;
	}

	public get title(): string {
		return this.screen.title;
	}
	public set title(value: string) {
		this.screen.title = value;
	}

	public get fov(): number {
		return this.screen.fov;
	}
	public set fov(value: number) {
		this.screen.fov = value;
	}

	public override get size(): Vec2 {
		return super.size;
	}
	public override set size(value: TVec2Source) {
		super.size = value;
		this.reset();
		this._events.emit('resize', { w: this.width, h: this.height });
	}

	public override get texture(): THREE.Texture {
		return this._target.texture;
	}

	public reset(): void {
		this._target = this._newTarget();
		this.draw();
		this.shaderMaterial.uniforms.t.value = this._target.texture;
		this._events.emit('reset', this._target.texture);
	}

	public draw(): void {
		const rt = this.renderer.getRenderTarget();
		this.renderer.setRenderTarget(this._target);
		this.screen.renderer.render(this._scene, this._camera);
		this.renderer.setRenderTarget(rt);
	}

	public _newTarget(): THREE.WebGLRenderTarget {
		return new this.screen.three.WebGLRenderTarget(this.w * 2, this.h * 2, {
			minFilter: this.screen.three.LinearFilter,
			magFilter: this.screen.three.NearestFilter,
			format: this.screen.three.RGBAFormat,
		});
	}

	private get shaderMaterial(): THREE.ShaderMaterial {
		return this.mesh.material as THREE.ShaderMaterial;
	}
}
