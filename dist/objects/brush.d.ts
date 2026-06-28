import type * as THREE from 'three';
import { Vec2 } from '../math/vec2.ts';
import type { Color } from '../math/color.ts';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';
import type { TVec2Source } from '../types.ts';
export type TBrushOpts = TDrawableOpts & {
    size?: number;
    visible?: boolean;
};
export declare class Brush extends Drawable {
    protected _size: number;
    constructor(opts: TBrushOpts);
    get size(): number;
    set size(value: number);
    get pos(): Vec2;
    set pos(value: TVec2Source);
    get visible(): boolean;
    set visible(value: boolean);
    get color(): Color;
    set color(value: Color);
    _geo(): THREE.BufferGeometry;
    _mat(): TMaterialWithCoreProps;
    _build(opts: TBrushOpts): TDrawableMesh;
    private get shaderMaterial();
}
