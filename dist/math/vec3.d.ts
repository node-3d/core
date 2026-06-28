import { Vec2 } from './vec2.ts';
import type { TVec2Source, TVec3Source } from '../types.ts';
type TVec3Object = Readonly<{
    x: number;
    y: number;
    z: number;
}>;
type TVec3CtorArg = number | TVec2Source | TVec3Source | TVec3Object | null | undefined;
type TVecCompare = (value: number, index: number) => boolean;
/**
 * Three-dimensional vector.
 *
 * All `*ed` methods modify this instance. The non-`ed` aliases return a copy.
 */
export declare class Vec3 extends Vec2 {
    constructor(x?: TVec3CtorArg, y?: number | TVec2Source, z?: number);
    get z(): number;
    set z(value: number);
    get xyz(): Vec3;
    set xyz(value: TVec3Source);
    get yxz(): Vec3;
    set yxz(value: TVec3Source);
    get zyx(): Vec3;
    set zyx(value: TVec3Source);
    get yzx(): Vec3;
    set yzx(value: TVec3Source);
    get xzy(): Vec3;
    set xzy(value: TVec3Source);
    plused(other: TVec3Source): this;
    minused(other: TVec3Source): this;
    muled(other: TVec3Source): this;
    dived(other: TVec3Source): this;
    maxed(other: TVec3Source): this;
    mined(other: TVec3Source): this;
    get neged(): this;
    scaled(scalar: number): this;
    fracted(scalar: number): this;
    get rounded(): this;
    get floored(): this;
    get ceiled(): this;
    get isZero(): boolean;
    cmp(cb: TVecCompare): boolean;
    dot(other: TVec3Source): number;
    toString(): string;
}
export {};
