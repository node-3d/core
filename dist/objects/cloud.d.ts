import type * as THREE from 'three';
import type { Color } from '../math/color.ts';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';
export type TUniformMap = Record<string, THREE.IUniform>;
export type TShaderInjectPart = Readonly<{
    vars?: string;
    before?: string;
    after?: string;
}>;
export type TShaderInject = Readonly<{
    vert?: TShaderInjectPart;
    frag?: TShaderInjectPart;
}>;
export type TCloudOpts = TDrawableOpts & {
    attrs: Record<string, TCloudAttribute> & {
        size?: TCloudAttribute | number;
    };
    count: number;
    uniforms?: TUniformMap;
    depthTest?: boolean;
    vert?: string;
    frag?: string;
    inject?: TShaderInject;
    size?: number | string;
    mode?: 'segments' | 'loop' | string;
};
export type TCloudAttribute = Readonly<{
    vbo: WebGLBuffer;
    items: number;
}>;
export declare class Cloud extends Drawable {
    constructor(opts: TCloudOpts);
    get color(): null;
    set color(_value: Color | null);
    buildAttr(source: TCloudAttribute, count: number): THREE.GLBufferAttribute;
    _geo(opts: TCloudOpts): THREE.BufferGeometry;
    _mat(opts: TCloudOpts): TMaterialWithCoreProps;
    buildVert(opts: TCloudOpts): string;
    buildFrag(opts: TCloudOpts): string;
    _build(opts: TCloudOpts): TDrawableMesh;
}
