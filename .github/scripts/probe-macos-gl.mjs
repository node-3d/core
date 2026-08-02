// oxlint-disable no-console node/no-sync node/no-process-env
import { spawnSync } from 'node:child_process';

const childArg = '--child';

const probes = [
	{
		name: 'GlfwWindow Cocoa hidden default',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'hidden',
	},
	{
		name: 'GlfwWindow Cocoa hidden no depth/stencil',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'GlfwWindow Cocoa hidden dont-care framebuffer',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'dont-care',
	},
	{
		name: 'GlfwWindow Cocoa hidden core profile',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'core-profile',
	},
	{
		name: 'GlfwWindow Null hidden default',
		kind: 'glfw',
		platform: 'null',
		window: 'hidden',
	},
	{
		name: 'GlfwWindow Null OSMesa hidden',
		kind: 'glfw',
		platform: 'null',
		window: 'osmesa',
	},
	{
		name: 'GlfwWindow Null EGL hidden',
		kind: 'glfw',
		platform: 'null',
		window: 'egl',
	},
	{
		name: 'BrowserDocument Cocoa hidden no depth/stencil',
		kind: 'document',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'BrowserDocument Null OSMesa hidden',
		kind: 'document',
		platform: 'null',
		window: 'osmesa',
	},
	{
		name: 'Core init Cocoa hidden no depth/stencil',
		kind: 'core',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'Core init Null OSMesa hidden',
		kind: 'core',
		platform: 'null',
		window: 'osmesa',
	},
];

const log = (...args) => {
	console.log('[macos-gl-probe]', ...args);
};

const asMessage = (error) => {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
};

const boolFromExitCode = (code) => code === 0;

const runParent = () => {
	log('parent node', process.version, process.platform, process.arch);

	const results = probes.map((probe) => {
		log(`child start: ${probe.name}`);
		const child = spawnSync(process.execPath, [import.meta.filename, childArg], {
			env: {
				...process.env,
				NODE_3D_MACOS_GL_PROBE: JSON.stringify(probe),
			},
			stdio: 'inherit',
		});

		const isOk = boolFromExitCode(child.status);
		log(`child ${isOk ? 'ok' : 'failed'}: ${probe.name}`);
		return isOk;
	});

	if (!results.some(Boolean)) {
		throw new Error('No macOS GLFW/OpenGL probe could create a context.');
	}
};

const readProbe = () => {
	const value = process.env['NODE_3D_MACOS_GL_PROBE'];
	if (!value) {
		throw new Error('Missing NODE_3D_MACOS_GL_PROBE.');
	}

	return JSON.parse(value);
};

const describeGlfw = (glfw) => {
	log('node', process.version, process.platform, process.arch);
	log('glfw version', glfw.getVersionString?.());
	log('glfw windowHint', typeof glfw.windowHint);
	log('glfw initHint', typeof glfw.initHint);
	log('glfw createWindow', typeof glfw.createWindow);
	log('glfw PLATFORM', glfw.PLATFORM);
	log('glfw PLATFORM_COCOA', glfw.PLATFORM_COCOA);
	log('glfw PLATFORM_NULL', glfw.PLATFORM_NULL);
	log('glfw CONTEXT_CREATION_API', glfw.CONTEXT_CREATION_API);
	log('glfw NATIVE_CONTEXT_API', glfw.NATIVE_CONTEXT_API);
	log('glfw EGL_CONTEXT_API', glfw.EGL_CONTEXT_API);
	log('glfw OSMESA_CONTEXT_API', glfw.OSMESA_CONTEXT_API);
	log('glfw STENCIL_BITS', glfw.STENCIL_BITS);
	log('glfw DEPTH_BITS', glfw.DEPTH_BITS);
	log('glfw SAMPLES', glfw.SAMPLES);
	log('glfw DONT_CARE', glfw.DONT_CARE);
	log('glfw property names', Object.getOwnPropertyNames(glfw).length);
	log('glfw enumerable keys', Object.keys(glfw).length);
};

const setInitHints = (glfw, probe) => {
	if (probe.platform === 'null') {
		glfw.initHint(glfw.PLATFORM, glfw.PLATFORM_NULL);
	} else if (probe.platform === 'cocoa') {
		glfw.initHint(glfw.PLATFORM, glfw.PLATFORM_COCOA);
	}
};

const initGlfw = (glfw, probe) => {
	setInitHints(glfw, probe);

	if (!glfw.init()) {
		throw new Error('Failed to initialize GLFW.');
	}

	glfw.defaultWindowHints();
};

const setWindowHints = (currentGlfw, windowKind) => {
	currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);

	if (windowKind === 'loose' || windowKind === 'osmesa' || windowKind === 'egl') {
		currentGlfw.windowHint(currentGlfw.STENCIL_BITS, 0);
		currentGlfw.windowHint(currentGlfw.DEPTH_BITS, 0);
		currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
	}

	if (windowKind === 'dont-care') {
		currentGlfw.windowHint(currentGlfw.RED_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.GREEN_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.BLUE_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.ALPHA_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.DEPTH_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.STENCIL_BITS, currentGlfw.DONT_CARE);
		currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
	}

	if (windowKind === 'core-profile') {
		currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MAJOR, 3);
		currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MINOR, 2);
		currentGlfw.windowHint(currentGlfw.OPENGL_FORWARD_COMPAT, currentGlfw.TRUE);
		currentGlfw.windowHint(currentGlfw.OPENGL_PROFILE, currentGlfw.OPENGL_CORE_PROFILE);
		currentGlfw.windowHint(currentGlfw.STENCIL_BITS, 0);
		currentGlfw.windowHint(currentGlfw.DEPTH_BITS, 0);
		currentGlfw.windowHint(currentGlfw.SAMPLES, 0);
	}

	if (windowKind === 'osmesa') {
		currentGlfw.windowHint(currentGlfw.CONTEXT_CREATION_API, currentGlfw.OSMESA_CONTEXT_API);
	}

	if (windowKind === 'egl') {
		currentGlfw.windowHint(currentGlfw.CONTEXT_CREATION_API, currentGlfw.EGL_CONTEXT_API);
	}
};

const makeBeforeWindow = (windowKind) => (_window, currentGlfw) => {
	setWindowHints(currentGlfw, windowKind);
};

const destroy = (window) => {
	try {
		window?.destroy();
	} catch (error) {
		log('destroy failed', asMessage(error));
	}
};

const printWindow = (window) => {
	log('window version', window.version);
	log('window size', JSON.stringify(window.size));
	log('framebuffer size', JSON.stringify(window.framebufferSize));
	log('platform context', window.platformContext);
};

const runChild = async () => {
	const probe = readProbe();

	// @node-3d/glfw checks this flag during module evaluation. Setting it before
	// dynamic imports lets this probe own glfwInitHint/glfwInit ordering.
	globalThis['__isGlfwInited'] = true;

	const { GlfwWindow, glfw } = await import('@node-3d/glfw');
	describeGlfw(glfw);
	log(`probe start: ${probe.name}`);
	initGlfw(glfw, probe);

	let window = null;
	try {
		if (probe.kind === 'glfw') {
			window = new GlfwWindow({
				width: 64,
				height: 64,
				major: probe.window === 'core-profile' ? 3 : 2,
				minor: probe.window === 'core-profile' ? 2 : 1,
				title: probe.name,
				onBeforeWindow: makeBeforeWindow(probe.window),
			});
		} else if (probe.kind === 'document') {
			const { BrowserDocument } = await import('../../ts/core/browser-document.ts');
			window = new BrowserDocument({
				width: 64,
				height: 64,
				title: probe.name,
				onBeforeWindow: makeBeforeWindow(probe.window),
			});
		} else if (probe.kind === 'core') {
			const { init } = await import('../../ts/index.ts');
			window = init({
				width: 64,
				height: 64,
				isVisible: false,
				title: probe.name,
				onBeforeWindow: makeBeforeWindow(probe.window),
			}).doc;
		} else {
			throw new Error(`Unknown probe kind: ${probe.kind}`);
		}

		log(`probe ok: ${probe.name}`);
		printWindow(window);
	} catch (error) {
		log(`probe failed: ${probe.name}`);
		log(asMessage(error));
		process.exitCode = 1;
	} finally {
		destroy(window);
		glfw.terminate();
	}
};

if (process.argv.includes(childArg)) {
	await runChild();
} else {
	runParent();
}
