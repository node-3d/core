import type { TVec2Source } from '../types.ts';

type TVec2Object = Readonly<{ x: number; y: number }>;
type TVec2CtorArg = number | TVec2Source | TVec2Object | null | undefined;
type TVecCompare = (value: number, index: number) => boolean;

const hasXY = (value: object): value is TVec2Object => (
	'x' in value && 'y' in value &&
	typeof value.x === 'number' && typeof value.y === 'number'
);

/**
 * Two-dimensional vector.
 *
 * All `*ed` methods modify this instance. The non-`ed` aliases return a copy.
 */
export class Vec2 extends Array<number> {
	public constructor(x?: TVec2CtorArg, y?: number) {
		super();
		
		this.x = 0;
		this.y = 0;
		
		if (x === undefined || x === null) {
			return;
		}
		
		if (typeof x === 'number') {
			if (Number.isNaN(x)) {
				return;
			}
			this.x = x;
			this.y = typeof y === 'number' ? y : x;
			return;
		}
		
		if (Array.isArray(x) || x instanceof Vec2) {
			this.x = x[0];
			this.y = x[1];
			return;
		}
		
		if (hasXY(x)) {
			this.x = x.x;
			this.y = x.y;
		}
	}
	
	public get x(): number { return this[0]; }
	public set x(value: number) { this[0] = value; }
	
	public get y(): number { return this[1]; }
	public set y(value: number) { this[1] = value; }
	
	public get clone(): this { return new (this.constructor as new (source: this) => this)(this); }
	
	public get xy(): Vec2 { return new Vec2(this); }
	public set xy(value: TVec2Source) { this[0] = value[0]; this[1] = value[1]; }
	
	public get yx(): Vec2 { return new Vec2([this[1], this[0]]); }
	public set yx(value: TVec2Source) { this[0] = value[1]; this[1] = value[0]; }
	
	public plused(other: TVec2Source): this { this[0] += other[0]; this[1] += other[1]; return this; }
	public plus(other: TVec2Source): this { return this.clone.plused(other); }
	public added(other: TVec2Source): this { return this.plused(other); }
	public add(other: TVec2Source): this { return this.clone.plused(other); }
	
	public minused(other: TVec2Source): this { this[0] -= other[0]; this[1] -= other[1]; return this; }
	public minus(other: TVec2Source): this { return this.clone.minused(other); }
	public subed(other: TVec2Source): this { return this.minused(other); }
	public sub(other: TVec2Source): this { return this.clone.minused(other); }
	public subtracted(other: TVec2Source): this { return this.minused(other); }
	public subtract(other: TVec2Source): this { return this.clone.minused(other); }
	
	public substracted(): never { throw new Error('Use subtract instead of sub-S-tract.'); }
	public substract(): never { throw new Error('Use subtract instead of sub-S-tract.'); }
	
	public muled(other: TVec2Source): this { this[0] *= other[0]; this[1] *= other[1]; return this; }
	public mul(other: TVec2Source): this { return this.clone.muled(other); }
	public multiplied(other: TVec2Source): this { return this.muled(other); }
	public multiply(other: TVec2Source): this { return this.clone.muled(other); }
	public crossed(other: TVec2Source): this { return this.muled(other); }
	public cross(other: TVec2Source): this { return this.clone.crossed(other); }
	
	public dived(other: TVec2Source): this { this[0] /= other[0]; this[1] /= other[1]; return this; }
	public div(other: TVec2Source): this { return this.clone.dived(other); }
	public divided(other: TVec2Source): this { return this.dived(other); }
	public divide(other: TVec2Source): this { return this.clone.dived(other); }
	
	public maxed(other: TVec2Source): this {
		this[0] = Math.max(this[0], other[0]);
		this[1] = Math.max(this[1], other[1]);
		return this;
	}
	public max(other: TVec2Source): this { return this.clone.maxed(other); }
	
	public mined(other: TVec2Source): this {
		this[0] = Math.min(this[0], other[0]);
		this[1] = Math.min(this[1], other[1]);
		return this;
	}
	public min(other: TVec2Source): this { return this.clone.mined(other); }
	
	public get neged(): this { this[0] = -this[0]; this[1] = -this[1]; return this; }
	public get neg(): this { return this.clone.neged; }
	
	public scaled(scalar: number): this { this[0] *= scalar; this[1] *= scalar; return this; }
	public scale(scalar: number): this { return this.clone.scaled(scalar); }
	
	public get rounded(): this { this[0] = Math.round(this[0]); this[1] = Math.round(this[1]); return this; }
	public get round(): this { return this.clone.rounded; }
	
	public get floored(): this { this[0] = Math.floor(this[0]); this[1] = Math.floor(this[1]); return this; }
	public get floor(): this { return this.clone.floored; }
	
	public get ceiled(): this { this[0] = Math.ceil(this[0]); this[1] = Math.ceil(this[1]); return this; }
	public get ceil(): this { return this.clone.ceiled; }
	
	public fracted(scalar: number): this { this[0] /= scalar; this[1] /= scalar; return this; }
	public fract(scalar: number): this { return this.clone.fracted(scalar); }
	
	public get isZero(): boolean { return this[0] === 0 && this[1] === 0; }
	public cmp(cb: TVecCompare): boolean { return cb(this[0], 0) && cb(this[1], 1); }
	
	public dot(other: TVec2Source): number { return this[0] * other[0] + this[1] * other[1]; }
	
	public get sqLen(): number { return this.dot(this); }
	public get sqLength(): number { return this.sqLen; }
	public get squareLength(): number { return this.sqLen; }
	
	public get len(): number { return Math.sqrt(this.sqLen); }
	public get length(): number { return this.len; }
	public get size(): number { return this.len; }
	
	public dist(other: TVec2Source): number { return new Vec2(other).minused(this).len; }
	public distance(other: TVec2Source): number { return this.dist(other); }
	
	public sqDist(other: TVec2Source): number { return new Vec2(other).minused(this).sqLen; }
	public sqDistance(other: TVec2Source): number { return this.sqDist(other); }
	public squareDistance(other: TVec2Source): number { return this.sqDist(other); }
	
	public copy(other: TVec2Source): this { this[0] = other[0]; this[1] = other[1]; return this; }
	
	public toString(): string { return `Vec2(${this[0]}, ${this[1]})`; }
	
	public get ortho(): Vec2 { return new Vec2(this[1], -this[0]); }
	public get orthoCw(): Vec2 { return this.ortho; }
	public get orthoClockwise(): Vec2 { return this.ortho; }
	
	public get orthoCcw(): Vec2 { return new Vec2(-this[1], this[0]); }
	public get orthoCounterClockwise(): Vec2 { return this.orthoCcw; }
	
	public crossLen(other: TVec2Source): number { return this[0] * other[1] - this[1] * other[0]; }
	public crossLength(other: TVec2Source): number { return this.crossLen(other); }
	
	public rotated(angle: number): this {
		if (angle === 0) {
			return this;
		}
		
		const x = this[0];
		const y = this[1];
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		this[0] = c * x - s * y;
		this[1] = s * x + c * y;
		return this;
	}
	public rotate(angle: number): this { return this.clone.rotated(angle); }
	
	public centroid(b: TVec2Source, c: TVec2Source): this {
		return this.clone.plused(b).plused(c).scaled(1 / 3);
	}
	
	public get normed(): this {
		const sqLen = this.sqLen;
		return sqLen > 0 ? this.scaled(1 / Math.sqrt(sqLen)) : this;
	}
	public get norm(): this { return this.clone.normed; }
	public get normalized(): this { return this.normed; }
	public get normalize(): this { return this.clone.normed; }
	
	public lerped(other: TVec2Source, t: number): this {
		return this.plused(new Vec2(other).minused(this).scaled(t));
	}
	public lerp(other: TVec2Source, t: number): this { return this.clone.lerped(other, t); }
	
	public reflected(normal: Vec2): this { return this.minused(normal.scale(2 * this.dot(normal))); }
	public reflect(normal: Vec2): this { return this.clone.reflected(normal); }
	
	public getLineSegmentsIntersection(
		p0: TVec2Source,
		p1: TVec2Source,
		p2: TVec2Source,
		p3: TVec2Source,
	): Vec2 | null {
		return Vec2.getLineSegmentsIntersection(p0, p1, p2, p3);
	}
	
	public getLineSegmentsIntersectionFraction(
		p0: TVec2Source,
		p1: TVec2Source,
		p2: TVec2Source,
		p3: TVec2Source,
	): number {
		return Vec2.getLineSegmentsIntersectionFraction(p0, p1, p2, p3);
	}
	
	public static getLineSegmentsIntersection(
		p0: TVec2Source,
		p1: TVec2Source,
		p2: TVec2Source,
		p3: TVec2Source,
	): Vec2 | null {
		const t = Vec2.getLineSegmentsIntersectionFraction(p0, p1, p2, p3);
		
		if (t < 0) {
			return null;
		}
		
		return new Vec2(p0[0] + (t * (p1[0] - p0[0])), p0[1] + (t * (p1[1] - p0[1])));
	}
	
	public static getLineSegmentsIntersectionFraction(
		p0: TVec2Source,
		p1: TVec2Source,
		p2: TVec2Source,
		p3: TVec2Source,
	): number {
		const s1X = p1[0] - p0[0];
		const s1Y = p1[1] - p0[1];
		const s2X = p3[0] - p2[0];
		const s2Y = p3[1] - p2[1];
		const denominator = -s2X * s1Y + s1X * s2Y;
		
		const s = (-s1Y * (p0[0] - p2[0]) + s1X * (p0[1] - p2[1])) / denominator;
		const t = (s2X * (p0[1] - p2[1]) - s2Y * (p0[0] - p2[0])) / denominator;
		
		return s >= 0 && s <= 1 && t >= 0 && t <= 1 ? t : -1;
	}
}

export default Vec2;
