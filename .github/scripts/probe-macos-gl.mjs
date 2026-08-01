// oxlint-disable no-console
import { GlfwWindow, glfw } from '@node-3d/glfw';
import { BrowserDocument } from '../../ts/core/browser-document.ts';
import { init } from '../../ts/index.ts';

const log = (...args) => {
	console.log('[macos-gl-probe]', ...args);
};

const describeGlfw = () => {
	log('node', process.version, process.platform, process.arch);
	log('glfw version', glfw.getVersionString?.());
	log('glfw windowHint', typeof glfw.windowHint);
	log('glfw createWindow', typeof glfw.createWindow);
	log('glfw STENCIL_BITS', glfw.STENCIL_BITS);
	log('glfw DEPTH_BITS', glfw.DEPTH_BITS);
	log('glfw SAMPLES', glfw.SAMPLES);
	log('glfw DONT_CARE', glfw.DONT_CARE);
	log('glfw property names', Object.getOwnPropertyNames(glfw).length);
	log('glfw enumerable keys', Object.keys(glfw).length);
};

const asMessage = (error) => {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
};

const destroy = (window) => {
	try {
		window?.destroy();
	} catch (error) {
		log('destroy failed', asMessage(error));
	}
};

const setHidden = (_window, currentGlfw) => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
};

const setLooseFramebuffer = (_window, currentGlfw) => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
	currentGlfw.windowHint(currentGlfw.STENCIL_BITS, 0);
	currentGlfw.windowHint(currentGlfw.DEPTH_BITS, 0);
	currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
};

const setDontCareFramebuffer = (_window, currentGlfw) => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
	currentGlfw.windowHint(currentGlfw.RED_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.GREEN_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.BLUE_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.ALPHA_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.DEPTH_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.STENCIL_BITS, currentGlfw.DONT_CARE);
	currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
};

const setCoreProfile = (_window, currentGlfw) => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
	currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MAJOR, 3);
	currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MINOR, 2);
	currentGlfw.windowHint(currentGlfw.OPENGL_FORWARD_COMPAT, currentGlfw.TRUE);
	currentGlfw.windowHint(currentGlfw.OPENGL_PROFILE, currentGlfw.OPENGL_CORE_PROFILE);
	currentGlfw.windowHint(currentGlfw.STENCIL_BITS, 0);
	currentGlfw.windowHint(currentGlfw.DEPTH_BITS, 0);
	currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
};

const probe = (name, create) => {
	log(`probe start: ${name}`);
	let window = null;

	try {
		window = create();
		log(`probe ok: ${name}`);
		log('window version', window.version);
		log('window size', JSON.stringify(window.size));
		log('framebuffer size', JSON.stringify(window.framebufferSize));
		log('platform context', window.platformContext);
		return true;
	} catch (error) {
		log(`probe failed: ${name}`);
		log(asMessage(error));
		return false;
	} finally {
		destroy(window);
	}
};

describeGlfw();

const results = [
	probe(
		'GlfwWindow hidden default',
		() => new GlfwWindow({ width: 64, height: 64, title: 'glfw-hidden-default', onBeforeWindow: setHidden }),
	),
	probe(
		'GlfwWindow hidden no depth/stencil',
		() =>
			new GlfwWindow({
				width: 64,
				height: 64,
				title: 'glfw-hidden-loose',
				onBeforeWindow: setLooseFramebuffer,
			}),
	),
	probe(
		'GlfwWindow hidden dont-care framebuffer',
		() =>
			new GlfwWindow({
				width: 64,
				height: 64,
				title: 'glfw-hidden-dont-care',
				onBeforeWindow: setDontCareFramebuffer,
			}),
	),
	probe(
		'GlfwWindow hidden core profile',
		() =>
			new GlfwWindow({
				width: 64,
				height: 64,
				major: 3,
				minor: 2,
				title: 'glfw-hidden-core-profile',
				onBeforeWindow: setCoreProfile,
			}),
	),
	probe(
		'BrowserDocument hidden no depth/stencil',
		() =>
			new BrowserDocument({
				width: 64,
				height: 64,
				title: 'browser-document-hidden-loose',
				onBeforeWindow: setLooseFramebuffer,
			}),
	),
	probe('core init hidden no depth/stencil', () =>
		init({
			width: 64,
			height: 64,
			isVisible: false,
			title: 'core-init-hidden-loose',
			onBeforeWindow: setLooseFramebuffer,
		}).doc,
	),
];

if (!results.some(Boolean)) {
	throw new Error('No macOS GLFW/OpenGL probe could create a context.');
}
