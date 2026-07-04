import { Vec2 } from './vec2.ts';
import type { TVec2Source, TVec3Source } from '../types.ts';

type TVec3Object = Readonly<{ x: number; y: number; z: number }>;
type TVec3CtorArg = number | TVec2Source | TVec3Source | TVec3Object | null | undefined;
type TVecCompare = (value: number, index: number) => boolean;

const hasXYZ = (value: object): value is TVec3Object =>
	'x' in value &&
	'y' in value &&
	'z' in value &&
	typeof value.x === 'number' &&
	typeof value.y === 'number' &&
	typeof value.z === 'number';

/**
 * Three-dimensional vector.
 *
 * All `*ed` methods modify this instance. The non-`ed` aliases return a copy.
 */
export class Vec3 extends Vec2 {
	public constructor(x?: TVec3CtorArg, y?: number | TVec2Source, z?: number) {
		super(x as number | TVec2Source | null | undefined, typeof y === 'number' ? y : undefined);

		this.z = 0;

		if (x === undefined || x === null) {
			return;
		}

		if (typeof x === 'number') {
			if (!Number.isNaN(x)) {
				this.z = typeof z === 'number' ? z : x;
			}
			return;
		}

		if (Array.isArray(x) || x instanceof Vec3) {
			this.z = x[2];
			return;
		}

		if (hasXYZ(x)) {
			this.z = x.z;
			return;
		}

		if (x instanceof Vec2) {
			if (Array.isArray(y) || y instanceof Vec2) {
				this.z = y[0];
			} else if (typeof y === 'number') {
				this.z = y;
			}
		}
	}

	public get z(): number {
		return this[2];
	}
	public set z(value: number) {
		this[2] = value;
	}

	public get xyz(): Vec3 {
		return new Vec3(this);
	}
	public set xyz(value: TVec3Source) {
		this[0] = value[0];
		this[1] = value[1];
		this[2] = value[2];
	}

	public get yxz(): Vec3 {
		return new Vec3([this[1], this[0], this[2]]);
	}
	public set yxz(value: TVec3Source) {
		this[1] = value[0];
		this[0] = value[1];
		this[2] = value[2];
	}

	public get zyx(): Vec3 {
		return new Vec3([this[2], this[1], this[0]]);
	}
	public set zyx(value: TVec3Source) {
		this[2] = value[0];
		this[1] = value[1];
		this[0] = value[2];
	}

	public get yzx(): Vec3 {
		return new Vec3([this[1], this[2], this[0]]);
	}
	public set yzx(value: TVec3Source) {
		this[0] = value[0];
		this[1] = value[1];
		this[2] = value[2];
	}

	public get xzy(): Vec3 {
		return new Vec3([this[0], this[2], this[1]]);
	}
	public set xzy(value: TVec3Source) {
		this[0] = value[0];
		this[2] = value[1];
		this[1] = value[2];
	}

	public override plused(other: TVec3Source): this {
		super.plused(other);
		this[2] += other[2];
		return this;
	}
	public override minused(other: TVec3Source): this {
		super.minused(other);
		this[2] -= other[2];
		return this;
	}
	public override muled(other: TVec3Source): this {
		super.muled(other);
		this[2] *= other[2];
		return this;
	}
	public override dived(other: TVec3Source): this {
		super.dived(other);
		this[2] /= other[2];
		return this;
	}
	public override maxed(other: TVec3Source): this {
		super.maxed(other);
		this[2] = Math.max(this[2], other[2]);
		return this;
	}
	public override mined(other: TVec3Source): this {
		super.mined(other);
		this[2] = Math.min(this[2], other[2]);
		return this;
	}

	public override get neged(): this {
		this[0] = -this[0];
		this[1] = -this[1];
		this[2] = -this[2];
		return this;
	}

	public override scaled(scalar: number): this {
		super.scaled(scalar);
		this[2] *= scalar;
		return this;
	}
	public override fracted(scalar: number): this {
		super.fracted(scalar);
		this[2] /= scalar;
		return this;
	}

	public override get rounded(): this {
		this[2] = Math.round(this[2]);
		return super.rounded;
	}
	public override get floored(): this {
		this[2] = Math.floor(this[2]);
		return super.floored;
	}
	public override get ceiled(): this {
		this[2] = Math.ceil(this[2]);
		return super.ceiled;
	}

	public override get isZero(): boolean {
		return super.isZero && this[2] === 0;
	}
	public override cmp(cb: TVecCompare): boolean {
		return super.cmp(cb) && cb(this[2], 2);
	}

	public override dot(other: TVec3Source): number {
		return super.dot(other) + this[2] * other[2];
	}

	public override toString(): string {
		return `Vec3(${this[0]}, ${this[1]}, ${this[2]})`;
	}
}
