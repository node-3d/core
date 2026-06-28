import { Vec2 } from './vec2.ts';
import { Vec3 } from './vec3.ts';
import type { TVec2Source, TVec3Source, TVec4Source } from '../types.ts';

type TVec4Object = Readonly<{ x: number; y: number; z: number; w: number }>;
type TVec4CtorArg = number | TVec2Source | TVec3Source | TVec4Source | TVec4Object | null | undefined;
type TVecCompare = (value: number, index: number) => boolean;

const hasXYZW = (value: object): value is TVec4Object => (
	'x' in value && 'y' in value && 'z' in value && 'w' in value &&
	typeof value.x === 'number' &&
	typeof value.y === 'number' &&
	typeof value.z === 'number' &&
	typeof value.w === 'number'
);

/**
 * Four-dimensional vector.
 *
 * All `*ed` methods modify this instance. The non-`ed` aliases return a copy.
 */
export class Vec4 extends Vec3 {
	public constructor(
		x?: TVec4CtorArg,
		y?: number | TVec2Source | TVec3Source,
		z?: number,
		w?: number,
	) {
		super(x as number | TVec2Source | TVec3Source | null | undefined, y, z);
		
		this.w = 1;
		
		if (x === undefined || x === null) {
			return;
		}
		
		if (typeof x === 'number') {
			if (!Number.isNaN(x)) {
				this.w = typeof w === 'number' ? w : x;
			}
			return;
		}
		
		this.w = Vec4.wFromObject(x, y);
	}
	
	public static wFromObject(source: TVec4CtorArg, next?: number | TVec2Source | TVec3Source): number {
		if (source === undefined || source === null || typeof source === 'number') {
			return 1;
		}
		
		if (Array.isArray(source) || source instanceof Vec4) {
			return source[3];
		}
		
		if (hasXYZW(source)) {
			return source.w;
		}
		
		if (source instanceof Vec3) {
			return typeof next === 'number' ? next : 1;
		}
		
		if (source instanceof Vec2) {
			if (Array.isArray(next) || next instanceof Vec2 || next instanceof Vec3) {
				return next[1];
			}
			
			if (typeof next === 'number') {
				return next;
			}
		}
		
		return 1;
	}
	
	public get w(): number { return this[3]; }
	public set w(value: number) { this[3] = value; }
	
	public get xyzw(): Vec4 { return new Vec4(this); }
	public set xyzw(value: TVec4Source) {
		this[0] = value[0]; this[1] = value[1]; this[2] = value[2]; this[3] = value[3];
	}
	
	public get yxzw(): Vec4 { return new Vec4([this[1], this[0], this[2], this[3]]); }
	public set yxzw(value: TVec4Source) {
		this[1] = value[0]; this[0] = value[1]; this[2] = value[2]; this[3] = value[3];
	}
	
	public get zyxw(): Vec4 { return new Vec4([this[2], this[1], this[0], this[3]]); }
	public set zyxw(value: TVec4Source) {
		this[2] = value[0]; this[1] = value[1]; this[0] = value[2]; this[3] = value[3];
	}
	
	public get yzxw(): Vec4 { return new Vec4([this[1], this[2], this[0], this[3]]); }
	public set yzxw(value: TVec4Source) {
		this[0] = value[0]; this[1] = value[1]; this[2] = value[2]; this[3] = value[3];
	}
	
	public get xzyw(): Vec4 { return new Vec4([this[0], this[2], this[1], this[3]]); }
	public set xzyw(value: TVec4Source) {
		this[0] = value[0]; this[2] = value[1]; this[1] = value[2]; this[3] = value[3];
	}
	
	public override plused(other: TVec4Source): this { super.plused(other); this[3] += other[3]; return this; }
	public override minused(other: TVec4Source): this { super.minused(other); this[3] -= other[3]; return this; }
	public override muled(other: TVec4Source): this { super.muled(other); this[3] *= other[3]; return this; }
	public override dived(other: TVec4Source): this { super.dived(other); this[3] /= other[3]; return this; }
	public override maxed(other: TVec4Source): this {
		super.maxed(other);
		this[3] = Math.max(this[3], other[3]);
		return this;
	}
	public override mined(other: TVec4Source): this {
		super.mined(other);
		this[3] = Math.min(this[3], other[3]);
		return this;
	}
	
	public override get neged(): this {
		this[0] = -this[0];
		this[1] = -this[1];
		this[2] = -this[2];
		this[3] = -this[3];
		return this;
	}
	
	public override scaled(scalar: number): this { super.scaled(scalar); this[3] *= scalar; return this; }
	public override fracted(scalar: number): this { super.fracted(scalar); this[3] /= scalar; return this; }
	
	public override get rounded(): this { this[3] = Math.round(this[3]); return super.rounded; }
	public override get floored(): this { this[3] = Math.floor(this[3]); return super.floored; }
	public override get ceiled(): this { this[3] = Math.ceil(this[3]); return super.ceiled; }
	
	public override get isZero(): boolean { return super.isZero && this[3] === 0; }
	public override cmp(cb: TVecCompare): boolean { return super.cmp(cb) && cb(this[3], 3); }
	
	public override dot(other: TVec4Source): number { return super.dot(other) + this[3] * other[3]; }
	
	public override toString(): string {
		return `Vec4(${this[0]}, ${this[1]}, ${this[2]}, ${this[3]})`;
	}
}
