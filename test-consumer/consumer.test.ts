import assert from 'node:assert/strict';
import { platform } from 'node:process';
import test from 'node:test';

import type { TGlfw } from '@node-3d/core';

const useHeadlessGlfw = platform === 'darwin';
const useGles = useHeadlessGlfw || platform === 'linux';

if (useHeadlessGlfw) {
	const nodeGlobal = globalThis as typeof globalThis & { __isGlfwInited?: boolean };
	nodeGlobal.__isGlfwInited = true;
}

const { glfw, init } = await import('@node-3d/core');

if (useHeadlessGlfw) {
	glfw.initHint(glfw.PLATFORM, glfw.PLATFORM_NULL);
	assert.equal(glfw.init(), true);
	glfw.defaultWindowHints();
}

const core = init({
	height: 32,
	isGles3: useGles,
	isVisible: false,
	isWebGL2: useGles,
	width: 32,
	onBeforeWindow(_window, currentGlfw) {
		if (!useGles) {
			return;
		}
		const current = currentGlfw as TGlfw;
		current.windowHint(current.VISIBLE, current.FALSE);
		current.windowHint(current.OPENGL_PROFILE, current.OPENGL_ANY_PROFILE);
		current.windowHint(current.CONTEXT_VERSION_MAJOR, 3);
		current.windowHint(current.CONTEXT_VERSION_MINOR, 2);
		current.windowHint(current.CLIENT_API, current.OPENGL_ES_API);
		current.windowHint(current.STENCIL_BITS, 0);
		current.windowHint(current.DEPTH_BITS, 0);
		current.windowHint(current.SAMPLES, 0);
	},
});

test('initializes the packed core runtime', () => {
	assert.equal(typeof core.doc.createElement, 'function');
	assert.equal(globalThis.document, core.doc);
	core.doc.destroy();
});
