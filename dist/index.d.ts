import { Image } from '@node-3d/image';
import { Window as GlfwWindow, Document as GlfwDocument } from '@node-3d/glfw';
import type { TCore3D, TGlfw, TInitOpts } from './types.ts';
export { addThreeHelpers } from './core/threejs-helpers.ts';
export { Image, GlfwDocument as Document, GlfwWindow as Window };
export * from './math/index.ts';
export * from './objects/index.ts';
export declare const glfw: TGlfw;
export declare const gl: import("@node-3d/webgl").TWebGL;
/**
 * Initialize Node3D. Creates the first window/document and sets up the global environment.
 * This function can be called repeatedly, but will ignore further calls.
 * The return value is cached and will be returned immediately for repeating calls.
 */
export declare const init: (opts?: TInitOpts) => TCore3D;
export type { TCore3D, TDocument, TGlfw, TImageConstructor, TInitOpts, TLocation, TNavigator, TWebgl, } from './types.ts';
