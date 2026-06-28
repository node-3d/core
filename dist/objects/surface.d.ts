import type * as THREE from 'three';
import { Rect } from './rect.ts';
import type { TRectOpts } from './rect.ts';
import { Vec2 } from '../math/vec2.ts';
import type { TDocument, TWebgl, TVec2Source } from '../types.ts';
export type TSurfaceOpts = TRectOpts & {
    camera?: THREE.PerspectiveCamera;
    scene?: THREE.Scene;
};
export declare class Surface extends Rect {
    private _events;
    private _camera;
    private _scene;
    private _target;
    constructor(opts: TSurfaceOpts);
    on(event: string, cb: (...args: unknown[]) => void): void;
    get canvas(): TDocument;
    get camera(): THREE.PerspectiveCamera;
    get scene(): THREE.Scene;
    get renderer(): THREE.WebGLRenderer;
    get context(): TWebgl;
    get document(): TDocument;
    get title(): string;
    set title(value: string);
    get fov(): number;
    set fov(value: number);
    get size(): Vec2;
    set size(value: TVec2Source);
    get texture(): THREE.Texture;
    reset(): void;
    draw(): void;
    _newTarget(): THREE.WebGLRenderTarget;
    private get shaderMaterial();
}
