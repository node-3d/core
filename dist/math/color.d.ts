import { Vec4 } from './vec4.ts';
import type { TColorSource, TVec3Source, TVec4Source } from '../types.ts';
type TRgba = Readonly<{
    r: number;
    g: number;
    b: number;
    a: number;
}>;
/**
 * Four-component color.
 */
export declare class Color extends Vec4 {
    constructor(source?: TColorSource, g?: number, b?: number, a?: number);
    static clampTo1(value: number): number;
    static rgbaFrom(source?: TColorSource, g?: number, b?: number, a?: number): TRgba;
    static rgbaFromEmpty(): TRgba;
    static rgbaFromObject(source: Exclude<TColorSource, string | number>, alpha?: number): TRgba;
    static rgbaFromFloats(rRaw: number, gRaw?: number, bRaw?: number, aRaw?: number): TRgba;
    static rgbaFromString(source: string | number): TRgba;
    get r(): number;
    set r(value: number);
    get g(): number;
    set g(value: number);
    get b(): number;
    set b(value: number);
    get a(): number;
    set a(value: number);
    get rgb(): Color;
    set rgb(value: TVec3Source);
    get rgba(): Color;
    set rgba(value: TVec4Source);
    get opacity(): number;
    get hex(): number;
    toHex(): number;
    get hexA(): number;
    toHexA(): number;
    toString(): string;
    toStringA(): string;
}
export default Color;
