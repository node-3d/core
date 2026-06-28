import { webgl } from '@node-3d/webgl';
import { Image } from '@node-3d/image';
import {
	glfw as glfwNative,
	Window as GlfwWindow,
	Document as GlfwDocument,
} from '@node-3d/glfw';
import type { Window as TGlfwWindow } from '@node-3d/glfw';
import { location } from './core/location.ts';
import { navigator } from './core/navigator.ts';
import { WebVRManager } from './core/vr-manager.ts';
import type {
	TCore3D,
	TDocument,
	TGlfw,
	TImageConstructor,
	TInitOpts,
	TMutableWebgl,
	TNode3DGlobal,
} from './types.ts';

export { addThreeHelpers } from './core/threejs-helpers.ts';
export { Image, GlfwDocument as Document, GlfwWindow as Window };

export * from './math/index.ts';
export * from './objects/index.ts';

export const glfw: TGlfw = {
	...glfwNative,
	Document: GlfwDocument,
	Window: GlfwWindow,
};
export const gl = webgl;

// oxlint-disable-next-line max-lines-per-function
const initCore = (_opts: TInitOpts = {}): TCore3D => {
	const opts = {
		mode: 'windowed' as const,
		vsync: true,
		..._opts,
	};
	
	const {
		isWebGL2,
		isGles3,
		isVisible,
		...optsDoc
	} = opts;
	
	const { Document } = glfw;
	
	Document.setWebgl(gl);
	Document.setImage(Image as unknown as Parameters<typeof Document.setImage>[0]);
	const imagePrototype = Image.prototype as TImageConstructor['prototype'];
	if (!imagePrototype.fillRect) {
		imagePrototype.fillRect = () => { /* nop */ };
	}
	
	if (isWebGL2) {
		gl.useWebGL2();
	}
	
	const onBeforeWindow = (window: TGlfwWindow, glfwRaw: unknown): void => {
		const currentGlfw = glfwRaw as TGlfw;
		if (isGles3) {
			currentGlfw.windowHint(currentGlfw.OPENGL_PROFILE, currentGlfw.OPENGL_ANY_PROFILE);
			currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MAJOR, 3);
			currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MINOR, 2);
			currentGlfw.windowHint(currentGlfw.CLIENT_API, currentGlfw.OPENGL_ES_API);
		}
		
		if (isVisible === false) {
			currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
		}
		
		if (optsDoc.onBeforeWindow) {
			optsDoc.onBeforeWindow(window, currentGlfw);
		}
	};
	
	if (!isGles3) {
		const mutableWebgl = gl as TMutableWebgl;
		const shaderSource = mutableWebgl.shaderSource;
		mutableWebgl.shaderSource = (shader, code) => shaderSource(
			shader,
			code.replaceAll(
				/^\s*?(#version|precision).*?($|;)/gmu, ''
			).replace(
				/^/u, '#extension GL_ARB_shading_language_420pack : require\n'
			).replace(
				/^/u, '#extension GL_ARB_explicit_attrib_location : enable\n'
			).replace(
				/^/u, '#version 140\n'
			).replaceAll(
				'gl_FragDepthEXT', 'gl_FragDepth'
			).replace(
				'#extension GL_EXT_frag_depth : enable', ''
			).replaceAll(
				/\bhighp\s+/gu, ''
			)
		);
	}
	
	const doc = new Document({ ...optsDoc, onBeforeWindow }) as unknown as TDocument;
	const nodeGlobal = globalThis as unknown as TNode3DGlobal;
	
	if (!nodeGlobal.self) {
		nodeGlobal.self = nodeGlobal;
	}
	
	if (!nodeGlobal.globalThis) {
		nodeGlobal.globalThis = nodeGlobal;
	}
	
	nodeGlobal.document = doc;
	nodeGlobal.window = doc;
	nodeGlobal.body = doc;
	nodeGlobal.cwrap = null;
	nodeGlobal.addEventListener = doc.addEventListener.bind(doc);
	nodeGlobal.removeEventListener = doc.removeEventListener.bind(doc);
	nodeGlobal.requestAnimationFrame = doc.requestAnimationFrame;
	nodeGlobal.cancelAnimationFrame = doc.cancelAnimationFrame;
	
	if (!nodeGlobal.location) {
		nodeGlobal.location = location;
	}
	doc.location = nodeGlobal.location;
	
	if (!nodeGlobal.navigator) {
		nodeGlobal.navigator = navigator;
	}
	
	nodeGlobal.WebVRManager = WebVRManager;
	nodeGlobal.Image = Image as TImageConstructor;
	// oxlint-disable-next-line no-underscore-dangle
	nodeGlobal._gl = gl;
	
	(gl as TMutableWebgl).canvas = doc;
	
	const core3d: TCore3D = {
		doc,
		loop: doc.loop,
		raf: doc.requestAnimationFrame,
	};
	
	return core3d;
};

let inited: TCore3D | null = null;

/**
 * Initialize Node3D. Creates the first window/document and sets up the global environment.
 * This function can be called repeatedly, but will ignore further calls.
 * The return value is cached and will be returned immediately for repeating calls.
 */
export const init = (opts: TInitOpts = {}): TCore3D => {
	if (inited) {
		return inited;
	}
	inited = initCore(opts);
	return inited;
};

export type {
	TCore3D,
	TDocument,
	TGlfw,
	TImageConstructor,
	TInitOpts,
	TLocation,
	TNavigator,
	TWebgl,
} from './types.ts';
