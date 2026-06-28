import { Vec3 } from './vec3.ts';
import type { TVec2Source, TVec3Source, TVec4Source } from '../types.ts';
type TVec4Object = Readonly<{
    x: number;
    y: number;
    z: number;
    w: number;
}>;
type TVec4CtorArg = number | TVec2Source | TVec3Source | TVec4Source | TVec4Object | null | undefined;
type TVecCompare = (value: number, index: number) => boolean;
/**
 * Four-dimensional vector.
 *
 * All `*ed` methods modify this instance. The non-`ed` aliases return a copy.
 */
export declare class Vec4 extends Vec3 {
    constructor(x?: TVec4CtorArg, y?: number | TVec2Source | TVec3Source, z?: number, w?: number);
    static wFromObject(source: TVec4CtorArg, next?: number | TVec2Source | TVec3Source): number;
    get w(): number;
    set w(value: number);
    get xyzw(): Vec4;
    set xyzw(value: TVec4Source);
    get yxzw(): Vec4;
    set yxzw(value: TVec4Source);
    get zyxw(): Vec4;
    set zyxw(value: TVec4Source);
    get yzxw(): Vec4;
    set yzxw(value: TVec4Source);
    get xzyw(): Vec4;
    set xzyw(value: TVec4Source);
    plused(other: TVec4Source): this;
    minused(other: TVec4Source): this;
    muled(other: TVec4Source): this;
    dived(other: TVec4Source): this;
    maxed(other: TVec4Source): this;
    mined(other: TVec4Source): this;
    get neged(): this;
    scaled(scalar: number): this;
    fracted(scalar: number): this;
    get rounded(): this;
    get floored(): this;
    get ceiled(): this;
    get isZero(): boolean;
    cmp(cb: TVecCompare): boolean;
    dot(other: TVec4Source): number;
    toString(): string;
}
export {};
