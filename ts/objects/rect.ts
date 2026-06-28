import type * as THREE from 'three';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';
import { Vec2 } from '../math/vec2.ts';
import type { TVec2Source } from '../types.ts';

const DEFAULT_SIZE = 600;

export type TRectOpts = TDrawableOpts & {
	size?: number | TVec2Source;
	radius?: number;
	wire?: boolean;
};

export class Rect extends Drawable {
	protected _size: Vec2;
	protected _radius: number;
	
	public constructor(opts: TRectOpts) {
		const vecSize = opts.size === undefined ? new Vec2(DEFAULT_SIZE, DEFAULT_SIZE) : new Vec2(opts.size);
		const sizeOffs = vecSize.scale(-0.5);
		const rectOpts: TRectOpts = {
			...opts,
			pos: opts.pos ?? sizeOffs,
			size: vecSize,
			radius: opts.radius ?? 0,
		};
		
		super(rectOpts);
		
		this._size = vecSize;
		this._radius = rectOpts.radius ?? 0;
	}
	
	public override _build(opts: TRectOpts): TDrawableMesh {
		const geometry = this._geo(opts);
		const material = this._mat(opts);
		
		if (opts.wire) {
			return new this.screen.three.Line(geometry, material) as unknown as TDrawableMesh;
		}
		
		return new this.screen.three.Mesh(geometry, material) as unknown as TDrawableMesh;
	}
	
	public override _mat(opts: TRectOpts): TMaterialWithCoreProps {
		const matOpts = {
			transparent: true,
			side: this.screen.three.DoubleSide,
			depthWrite: false,
			depthTest: false,
		};
		
		if (opts.wire) {
			return new this.screen.three.LineBasicMaterial({ ...matOpts, linewidth: 1 });
		}
		
		return new this.screen.three.MeshBasicMaterial(matOpts);
	}
	
	public get size(): Vec2 { return this._size.xy; }
	public set size(value: TVec2Source) {
		this._size.xy = value;
		this.updateGeo();
	}
	
	public get width(): number { return this._size.x; }
	public get height(): number { return this._size.y; }
	
	public get w(): number { return this._size.x; }
	public get h(): number { return this._size.y; }
	
	public get radius(): number { return this._radius; }
	public set radius(value: number) {
		this._radius = value;
		this.updateGeo();
	}
	
	public get texture(): THREE.Texture | null | undefined {
		return this._mesh.material.map;
	}
	public set texture(tex: THREE.Texture | null | undefined) {
		this._mesh.material.map = tex;
		this._mesh.material.needsUpdate = true;
	}
	
	public override _geo(opts: TRectOpts): THREE.BufferGeometry {
		const size = opts.size === undefined ? new Vec2(100, 100) : new Vec2(opts.size);
		const radius = opts.radius || 0;
		const width = size.x;
		const height = size.y;
		const geometry: THREE.BufferGeometry = radius ? (() => {
			const shape = new this.screen.three.Shape();
			
			shape.moveTo(0, radius);
			shape.lineTo(0, height - radius);
			shape.quadraticCurveTo(0, height, radius, height);
			shape.lineTo(width - radius, height);
			shape.quadraticCurveTo(width, height, width, height - radius);
			shape.lineTo(width, radius);
			shape.quadraticCurveTo(width, 0, width - radius, 0);
			shape.lineTo(radius, 0);
			shape.quadraticCurveTo(0, 0, 0, radius);
			
			const shapeGeometry = new this.screen.three.ShapeGeometry(shape);
			shapeGeometry.translate(-width * 0.5, -height * 0.5, 0);
			return shapeGeometry;
		})() : new this.screen.three.PlaneGeometry(width, height);
		
		geometry.rotateX(Math.PI);
		geometry.translate(width * 0.5, height * 0.5, 0);
		geometry.computeBoundingBox();
		
		return geometry;
	}
}
