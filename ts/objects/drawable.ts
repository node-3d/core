import type * as THREE from 'three';
import { Vec2 } from '../math/vec2.ts';
import { Color } from '../math/color.ts';
import type { TColorSource, TThree, TVec2Source } from '../types.ts';
import type { Screen } from './screen.ts';

export type TDrawableOpts = {
	screen: Screen;
	pos?: TVec2Source;
	z?: number;
	color?: TColorSource;
};

export type TMaterialWithCoreProps = THREE.Material & {
	color?: {
		setHex: (value: number) => void;
	};
	opacity?: number;
	map?: THREE.Texture | null;
	uniforms?: Record<string, THREE.IUniform>;
};

export type TDrawableMesh = THREE.Object3D & {
	geometry: THREE.BufferGeometry;
	material: TMaterialWithCoreProps;
};

export class Drawable {
	protected _screen: Screen;
	protected _three: TThree;
	protected _pos: Vec2;
	protected _z: number;
	protected _visible: boolean;
	protected _mesh: TDrawableMesh;
	protected _color!: Color;

	public constructor(opts: TDrawableOpts) {
		this._screen = opts.screen;
		this._three = this._screen.three;

		this._pos = new Vec2(opts.pos || [0, 0]);
		this._z = 0;
		this._visible = true;
		this._mesh = this._build(opts);

		this.screen.scene.add(this._mesh);

		this.color = Drawable.makeColor(opts.color);
		this.pos = this._pos;
		this.z = opts.z || 0;
	}

	public get three(): TThree {
		return this._three;
	}

	public get screen(): Screen {
		return this._screen;
	}
	public set screen(_value: Screen) {
		/* for convenience of passing Drawable as opts */
	}

	public get mat(): TMaterialWithCoreProps {
		return this._mesh.material;
	}
	public get geo(): THREE.BufferGeometry {
		return this._mesh.geometry;
	}
	public get mesh(): TDrawableMesh {
		return this._mesh;
	}

	public get z(): number {
		return this._z;
	}
	public set z(value: number) {
		this._z = value;
		this._mesh.position.z = this._z;
	}

	public get visible(): boolean {
		return this._visible;
	}
	public set visible(value: boolean) {
		this._visible = value;
		this._mesh.visible = this._visible;
	}

	public get pos(): Vec2 {
		return this._pos.xy;
	}
	public set pos(value: TVec2Source) {
		this._pos.copy(value);
		this._mesh.position.x = this._pos.x;
		this._mesh.position.y = this._pos.y;
	}

	public get color(): Color | null {
		return this._color;
	}
	public set color(value: Color) {
		this._color = value;

		if (this.mat.color) {
			this.mat.color.setHex(this._color.toHex());
		}
		if (this.mat.opacity !== undefined) {
			this.mat.opacity = this._color.a;
		}
	}

	public _build(opts: TDrawableOpts): TDrawableMesh {
		return new this.screen.three.Mesh(
			this._geo(opts),
			this._mat(opts),
		) as unknown as TDrawableMesh;
	}

	public _geo(_opts?: TDrawableOpts): THREE.BufferGeometry {
		return new this.screen.three.PlaneGeometry(2, 2);
	}

	public updateGeo(): void {
		this._mesh.geometry = this._geo(this as unknown as TDrawableOpts);
		(this._mesh.geometry as THREE.BufferGeometry & { needsUpdate?: boolean }).needsUpdate =
			true;
	}

	public _mat(_opts?: TDrawableOpts): TMaterialWithCoreProps {
		return new this.screen.three.MeshBasicMaterial({
			transparent: true,
			side: this.screen.three.DoubleSide,
			depthWrite: true,
			depthTest: true,
		});
	}

	public remove(): void {
		this.screen.scene.remove(this._mesh);
	}

	protected static makeColor(source?: TColorSource): Color {
		return source instanceof Color ? source : new Color(source ?? 0xffffff);
	}
}
