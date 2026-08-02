// oxlint-disable no-console node/no-sync node/no-process-env
import { spawnSync } from 'node:child_process';

const childArg = '--child';

const probes = [
	{
		name: 'glfw/cocoa/default',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'hidden',
	},
	{
		name: 'glfw/cocoa/loose',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'glfw/cocoa/dont-care',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'dont-care',
	},
	{
		name: 'glfw/cocoa/core',
		kind: 'glfw',
		platform: 'cocoa',
		window: 'core-profile',
	},
	{
		name: 'glfw/null/default',
		kind: 'glfw',
		platform: 'null',
		window: 'hidden',
	},
	{
		name: 'glfw/null/osmesa',
		kind: 'glfw',
		platform: 'null',
		window: 'osmesa',
	},
	{
		name: 'glfw/null/egl',
		kind: 'glfw',
		platform: 'null',
		window: 'egl',
	},
	{
		name: 'doc/cocoa/loose',
		kind: 'document',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'doc/null/osmesa',
		kind: 'document',
		platform: 'null',
		window: 'osmesa',
	},
	{
		name: 'doc/null/egl',
		kind: 'document',
		platform: 'null',
		window: 'egl',
	},
	{
		name: 'core/cocoa/loose',
		kind: 'core',
		platform: 'cocoa',
		window: 'loose',
	},
	{
		name: 'core/null/osmesa',
		kind: 'core',
		platform: 'null',
		window: 'osmesa',
	},
	{
		name: 'core/null/egl',
		kind: 'core',
		platform: 'null',
		window: 'egl',
	},
];

const reportPrefix = '__NODE_3D_GL_PROBE__';

const log = (...args) => {
	console.log('[gl]', ...args);
};

const asMessage = (error) => {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
};

const boolFromExitCode = (code) => code === 0;

const exitText = (child) => {
	if (child.error) {
		return child.error.message;
	}

	if (child.signal) {
		return `signal ${child.signal}`;
	}

	return `exit ${child.status}`;
};

const uniq = (values) => [...new Set(values)];

const extractGlfwErrors = (output) =>
	uniq(
		output
			.split(/\r?\n/u)
			.map((line) => line.trim())
			.filter((line) => line.startsWith('GLFW Error ')),
	);

const readChildReport = (stdout) => {
	const line = stdout
		.split(/\r?\n/u)
		.find((currentLine) => currentLine.startsWith(reportPrefix));

	if (!line) {
		return null;
	}

	return JSON.parse(line.slice(reportPrefix.length));
};

const envText = () => {
	const dyld = process.env['DYLD_LIBRARY_PATH'] || '<unset>';
	const fallback = process.env['DYLD_FALLBACK_LIBRARY_PATH'] || '<unset>';
	const software = process.env['LIBGL_ALWAYS_SOFTWARE'] || '<unset>';
	const driver = process.env['MESA_LOADER_DRIVER_OVERRIDE'] || '<unset>';
	return `dyld=${dyld} fallback=${fallback} software=${software} driver=${driver}`;
};

const runParent = () => {
	log('node', process.version, process.platform, process.arch);
	log('env', envText());

	const results = probes.map((probe) => {
		const child = spawnSync(process.execPath, [import.meta.filename, childArg], {
			encoding: 'utf8',
			env: {
				...process.env,
				NODE_3D_MACOS_GL_PROBE: JSON.stringify(probe),
			},
		});

		const isOk = boolFromExitCode(child.status);
		const stdout = child.stdout || '';
		const stderr = child.stderr || '';
		const report = readChildReport(stdout);
		const glfwErrors = extractGlfwErrors(`${stdout}\n${stderr}`);

		if (isOk && report?.ok) {
			log(`ok ${probe.name}: version=${report.version} fb=${report.framebufferSize}`);
		} else {
			const error = report?.error || exitText(child);
			const glfwText = glfwErrors.length > 0 ? `; ${glfwErrors.join(' | ')}` : '';
			log(`fail ${probe.name}: ${error}${glfwText}`);
		}

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

const writeReport = (report) => {
	console.log(`${reportPrefix}${JSON.stringify(report)}`);
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

const destroy = (window, logger = log) => {
	try {
		window?.destroy();
	} catch (error) {
		logger('destroy failed', asMessage(error));
	}
};

const runChild = async () => {
	const probe = readProbe();

	// @node-3d/glfw checks this flag during module evaluation. Setting it before
	// dynamic imports lets this probe own glfwInitHint/glfwInit ordering.
	globalThis['__isGlfwInited'] = true;

	const { GlfwWindow, glfw } = await import('@node-3d/glfw');
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

		writeReport({
			ok: true,
			name: probe.name,
			version: window.version,
			framebufferSize: window.framebufferSize,
			platformContext: window.platformContext,
		});
	} catch (error) {
		writeReport({
			ok: false,
			name: probe.name,
			error: asMessage(error),
		});
		process.exitCode = 1;
	} finally {
		destroy(window, () => null);
		glfw.terminate();
	}
};

if (process.argv.includes(childArg)) {
	await runChild();
} else {
	runParent();
}
