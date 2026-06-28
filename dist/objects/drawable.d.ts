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
export declare class Drawable {
    protected _screen: Screen;
    protected _three: TThree;
    protected _pos: Vec2;
    protected _z: number;
    protected _visible: boolean;
    protected _mesh: TDrawableMesh;
    protected _color: Color;
    constructor(opts: TDrawableOpts);
    get three(): TThree;
    get screen(): Screen;
    set screen(_value: Screen);
    get mat(): TMaterialWithCoreProps;
    get geo(): THREE.BufferGeometry;
    get mesh(): TDrawableMesh;
    get z(): number;
    set z(value: number);
    get visible(): boolean;
    set visible(value: boolean);
    get pos(): Vec2;
    set pos(value: TVec2Source);
    get color(): Color | null;
    set color(value: Color);
    _build(opts: TDrawableOpts): TDrawableMesh;
    _geo(_opts?: TDrawableOpts): THREE.BufferGeometry;
    updateGeo(): void;
    _mat(_opts?: TDrawableOpts): TMaterialWithCoreProps;
    remove(): void;
    protected static makeColor(source?: TColorSource): Color;
}
