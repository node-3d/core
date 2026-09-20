import * as THREE from 'three';
import { Vec2 } from '../math/vec2.ts';
import type { Color } from '../math/color.ts';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';
import type { TVec2Source } from '../types.ts';

export type TBrushOpts = TDrawableOpts & {
	size?: number;
	visible?: boolean;
};

export class Brush extends Drawable {
	protected _size: number;

	public constructor(opts: TBrushOpts) {
		super({ screen: opts.screen, color: opts.color });

		this._size = opts.size ?? 100;
		this._pos = opts.pos ? new Vec2(opts.pos) : new Vec2();

		if (opts.visible !== undefined && !opts.visible) {
			this.visible = false;
		}

		this.screen.on('resize', () => {
			const uniforms = this.shaderMaterial.uniforms;
			if (uniforms.aspect) {
				uniforms.aspect.value = this.screen.w / this.screen.h;
			}
			if (uniforms.size) {
				uniforms.size.value = this._size / this.screen.h;
			}
		});
	}

	public get size(): number {
		return this._size;
	}
	public set size(value: number) {
		this._size = value;
		if (this.visible && this.shaderMaterial.uniforms.size) {
			this.shaderMaterial.uniforms.size.value = this._size;
		}
	}

	public override get pos(): Vec2 {
		return this._pos;
	}
	public override set pos(value: TVec2Source) {
		this._pos.copy(value);
		if (this.visible && this.shaderMaterial.uniforms.pos) {
			this.shaderMaterial.uniforms.pos.value = new THREE.Vector2(
				(this._pos.x / this.screen.w - 0.5) * 2,
				(-this._pos.y / this.screen.h + 0.5) * 2,
			);
		}
	}

	public override get visible(): boolean {
		return super.visible;
	}
	public override set visible(value: boolean) {
		super.visible = value;

		if (this.visible) {
			const uniforms = this.shaderMaterial.uniforms;
			if (uniforms.pos) {
				uniforms.pos.value = new THREE.Vector2(this._pos.x, this._pos.y);
			}
			if (uniforms.size) {
				uniforms.size.value = this._size / this.screen.h;
			}
			if (uniforms.color) {
				uniforms.color.value = new THREE.Vector3(
					this._color.r,
					this._color.g,
					this._color.b,
				);
			}
		}
	}

	public override get color(): Color {
		return this._color;
	}
	public override set color(value: Color) {
		this._color = value;
		if (this.visible && this.shaderMaterial.uniforms.color) {
			this.shaderMaterial.uniforms.color.value = new THREE.Vector3(
				this._color.r,
				this._color.g,
				this._color.b,
			);
		}
	}

	public override _geo(): THREE.BufferGeometry {
		const geo = new THREE.PlaneGeometry(2, 2);
		geo.computeBoundingSphere = () => {
			geo.boundingSphere = new THREE.Sphere(undefined, Infinity);
		};
		geo.computeBoundingSphere();
		geo.computeBoundingBox = () => {
			geo.boundingBox = new THREE.Box3();
		};
		geo.computeBoundingBox();
		return geo;
	}

	public override _mat(): TMaterialWithCoreProps {
		return new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			uniforms: {
				aspect: { value: this.screen.w / this.screen.h },
				size: { value: 100 / this.screen.h },
				pos: { value: new THREE.Vector2(0, 0) },
				color: { value: new THREE.Vector3(0, 1, 1) },
			},
			vertexShader: `
				varying vec3 projPos;

				void main() {
					projPos  = position.xyz;

					gl_Position = vec4(position.xyz, 1.0);
				}
			`,
			fragmentShader: `
				varying vec3 projPos;

				uniform vec2  pos;
				uniform float size;
				uniform vec3  color;
				uniform float aspect;

				void main() {
					vec2 diff = projPos.xy - pos;
					diff.x *= aspect;
					float dist = length(diff);

					float opacity = pow(1.0 - min(1.0, abs(dist - size)), 100.0);
					gl_FragColor = vec4(color, opacity);
				}
			`,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
		});
	}

	public override _build(_opts: TBrushOpts): TDrawableMesh {
		return new THREE.Mesh(this._geo(), this._mat());
	}

	private get shaderMaterial(): THREE.ShaderMaterial {
		return this._mesh.material as THREE.ShaderMaterial;
	}
}
