import EventEmitter from 'node:events';
import * as THREE from 'three';
import { webgl } from '@node-3d/webgl';
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
	private readonly _events: EventEmitter;
	private readonly _camera: THREE.PerspectiveCamera;
	private readonly _scene: THREE.Scene;
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
			this._camera = new THREE.PerspectiveCamera(
				DEFAULT_FOV,
				this.width / this.height,
				DEFAULT_NEAR,
				DEFAULT_FAR,
			);
			this._camera.position.z = 10;
		}

		this._scene = opts.scene ?? new THREE.Scene();
		this._target = this._newTarget();
		this.draw();

		this.mesh.material = new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
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
			this.mesh.geometry.boundingSphere = new THREE.Sphere(undefined, Infinity);
		};
		this.mesh.geometry.computeBoundingSphere();

		this.mesh.geometry.computeBoundingBox = () => {
			this.mesh.geometry.boundingBox = new THREE.Box3();
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
		return webgl;
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
		if (this.shaderMaterial.uniforms.t) {
			this.shaderMaterial.uniforms.t.value = this._target.texture;
		}
		this._events.emit('reset', this._target.texture);
	}

	public draw(): void {
		const rt = this.renderer.getRenderTarget();
		this.renderer.setRenderTarget(this._target);
		this.screen.renderer.render(this._scene, this._camera);
		this.renderer.setRenderTarget(rt);
	}

	public _newTarget(): THREE.WebGLRenderTarget {
		return new THREE.WebGLRenderTarget(this.w * 2, this.h * 2, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
		});
	}

	private get shaderMaterial(): THREE.ShaderMaterial {
		return this.mesh.material as THREE.ShaderMaterial;
	}
}
