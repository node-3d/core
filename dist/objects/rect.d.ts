import type * as THREE from 'three';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';
import { Vec2 } from '../math/vec2.ts';
import type { TVec2Source } from '../types.ts';
export type TRectOpts = TDrawableOpts & {
    size?: number | TVec2Source;
    radius?: number;
    wire?: boolean;
};
export declare class Rect extends Drawable {
    protected _size: Vec2;
    protected _radius: number;
    constructor(opts: TRectOpts);
    _build(opts: TRectOpts): TDrawableMesh;
    _mat(opts: TRectOpts): TMaterialWithCoreProps;
    get size(): Vec2;
    set size(value: TVec2Source);
    get width(): number;
    get height(): number;
    get w(): number;
    get h(): number;
    get radius(): number;
    set radius(value: number);
    get texture(): THREE.Texture | null | undefined;
    set texture(tex: THREE.Texture | null | undefined);
    _geo(opts: TRectOpts): THREE.BufferGeometry;
}
