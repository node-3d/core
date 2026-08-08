import { platform } from 'node:process';
import * as three from 'three';
import type { TGlfw, TInitOpts } from '../ts/types.ts';

const shouldUseHeadlessGlfw = platform === 'darwin';

const applyHeadlessWindowHints = (currentGlfw: TGlfw): void => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
	currentGlfw.windowHint(currentGlfw.CONTEXT_CREATION_API, currentGlfw.EGL_CONTEXT_API);
	currentGlfw.windowHint(currentGlfw.OPENGL_PROFILE, currentGlfw.OPENGL_ANY_PROFILE);
	currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MAJOR, 3);
	currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MINOR, 2);
	currentGlfw.windowHint(currentGlfw.CLIENT_API, currentGlfw.OPENGL_ES_API);
	currentGlfw.windowHint(currentGlfw.STENCIL_BITS, 0);
	currentGlfw.windowHint(currentGlfw.DEPTH_BITS, 0);
	currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
};

const bootstrapHeadlessGlfw = async (): Promise<TGlfw | null> => {
	if (!shouldUseHeadlessGlfw) {
		return null;
	}

	const nodeGlobal = globalThis as unknown as Record<string, unknown>;

	// @node-3d/glfw normally initializes on import. CI headless tests need
	// glfwInitHint before glfwInit so they can use the Null platform.
	nodeGlobal['__isGlfwInited'] = true;
	const { glfw: bootstrappedGlfw } = await import('@node-3d/glfw');
	bootstrappedGlfw.initHint(bootstrappedGlfw.PLATFORM, bootstrappedGlfw.PLATFORM_NULL);

	if (!bootstrappedGlfw.init()) {
		throw new Error('Failed to initialize GLFW for headless tests');
	}

	bootstrappedGlfw.defaultWindowHints();
	nodeGlobal['__isGlfwInited'] = true;

	return bootstrappedGlfw;
};

const headlessGlfw = await bootstrapHeadlessGlfw();
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
const initOptsHeadless: TInitOpts = {
	...initOptsLinux,
	isVisible: false,
	onBeforeWindow(_window, currentGlfw) {
		applyHeadlessWindowHints(currentGlfw as TGlfw);
	},
};

if (shouldUseHeadlessGlfw) {
	(headlessGlfw ?? glfw).windowHint(glfw.STENCIL_BITS, 0);
	// this would be nice... - https://github.com/glfw/glfw/pull/2571
	// glfw.windowHint(glfw.CONTEXT_RENDERER, glfw.SOFTWARE_RENDERER);
}

const getInitOpts = (): TInitOpts => {
	if (shouldUseHeadlessGlfw) {
		return initOptsHeadless;
	}

	if (platform === 'linux') {
		return initOptsLinux;
	}

	return initOpts;
};

const inited = init(getInitOpts());
addThreeHelpers(three);

const { doc } = inited;
const window = doc;
const document = doc;

export const {
	Brush,
	BrowserDocument,
	BrowserWindow,
	Cloud,
	Drawable,
	gl,
	Image,
	Lines,
	Points,
	Rect,
	Screen,
	Surface,
	Tris,
} = core;

export { doc, window, document, glfw };

const getTestDocumentOpts = (opts: TInitOpts = {}): TInitOpts => {
	if (!shouldUseHeadlessGlfw) {
		return opts;
	}

	return {
		...opts,
		onBeforeWindow(windowCurrent, currentGlfw) {
			applyHeadlessWindowHints(currentGlfw as TGlfw);
			opts.onBeforeWindow?.(windowCurrent, currentGlfw);
		},
	};
};

export const createTestDocument = (opts: TInitOpts = {}): InstanceType<typeof BrowserDocument> =>
	new BrowserDocument(getTestDocumentOpts(opts));

export default inited;
