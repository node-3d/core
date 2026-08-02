import { platform } from 'node:process';
import * as three from 'three';
import type { TGlfw, TInitOpts } from '../ts/types.ts';

const bootstrapMacosGlfw = async (): Promise<TGlfw | null> => {
	if (platform !== 'darwin') {
		return null;
	}

	const nodeGlobal = globalThis as unknown as Record<string, unknown>;

	// @node-3d/glfw normally initializes on import. The macOS CI path needs
	// glfwInitHint before glfwInit so it can use the Null platform.
	nodeGlobal['__isGlfwInited'] = true;
	const { glfw: bootstrappedGlfw } = await import('@node-3d/glfw');
	bootstrappedGlfw.initHint(bootstrappedGlfw.PLATFORM, bootstrappedGlfw.PLATFORM_NULL);

	if (!bootstrappedGlfw.init()) {
		throw new Error('Failed to initialize GLFW for macOS tests');
	}

	bootstrappedGlfw.defaultWindowHints();
	nodeGlobal['__isGlfwInited'] = true;

	return bootstrappedGlfw;
};

const macosGlfw = await bootstrapMacosGlfw();
const core = await import('../ts/index.ts');
const { init, addThreeHelpers, glfw } = core;

const initOptsLinux = {
	width: 400,
	height: 400,
	isGles3: true,
	isWebGL2: true,
};
const initOpts = {
	width: 400,
	height: 400,
	isGles3: false,
	major: 2,
	minor: 1,
};
const initOptsMacos: TInitOpts = {
	...initOpts,
	isVisible: false,
	onBeforeWindow(_window, currentGlfw) {
		const windowGlfw = currentGlfw as TGlfw;
		windowGlfw.windowHint(windowGlfw.CONTEXT_CREATION_API, windowGlfw.OSMESA_CONTEXT_API);
		windowGlfw.windowHint(windowGlfw.STENCIL_BITS, 8);
		windowGlfw.windowHint(windowGlfw.DEPTH_BITS, 0);
		windowGlfw.windowHint(windowGlfw.SAMPLES, 0);
	},
};

if (platform === 'darwin') {
	(macosGlfw ?? glfw).windowHint(glfw.STENCIL_BITS, 8);
	// this would be nice... - https://github.com/glfw/glfw/pull/2571
	// glfw.windowHint(glfw.CONTEXT_RENDERER, glfw.SOFTWARE_RENDERER);
}

const getInitOpts = (): TInitOpts => {
	if (platform === 'linux') {
		return initOptsLinux;
	}

	if (platform === 'darwin') {
		return initOptsMacos;
	}

	return initOpts;
};

const inited = init(getInitOpts());
addThreeHelpers(three);

const { doc } = inited;
const window = doc;
const document = doc;

export const { Image } = core;

export { doc, window, document };

export default inited;
