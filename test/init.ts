import { platform } from 'node:process';
import { init, addThreeHelpers, Image, glfw } from '../ts/index.ts';
import * as three from 'three';

const initOptsLinux = {
	width: 400, height: 400,
	isGles3: true,
	isWebGL2: true,
};
const initOpts = {
	width: 400, height: 400,
	isGles3: false,
	major: 2,
	minor: 1,
};

if (platform === 'darwin') {
	glfw.windowHint(glfw.STENCIL_BITS, 8);
	// this would be nice... - https://github.com/glfw/glfw/pull/2571
	// glfw.windowHint(glfw.CONTEXT_RENDERER, glfw.SOFTWARE_RENDERER);
}

const inited = init(platform === 'linux' ? initOptsLinux : initOpts);
addThreeHelpers(three);

const { doc } = inited;
const window = doc;
const document = doc;

export { doc, Image, window, document };
export default inited;
