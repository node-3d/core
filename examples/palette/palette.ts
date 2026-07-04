import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { glfw } from '@node-3d/glfw';
import { Image } from '@node-3d/image';

import { Screen, addThreeHelpers, init } from '@node-3d/core';
import {
	createColorQuads,
	createPostMaterial,
	createRenderTarget,
	debugShaders,
	generatePalette,
	populateScene,
} from './utils/index.ts';
import type { THueMode } from './utils/index.ts';

const IS_PERF_MODE = !true;

const hueModes: THueMode[] = ['monochromatic', 'analagous', 'complementary', 'triadic', 'tetradic'];

const extraCodes = (glfw as unknown as { extraCodes: Record<number, number> }).extraCodes;

const { doc, loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	title: 'Palette Swap',
	vsync: !IS_PERF_MODE,
});
addThreeHelpers(THREE);

const icon = new Image('textures/icon.png');
icon.on('load', () => {
	if (icon.data) {
		doc.icon = { width: icon.width, height: icon.height, data: icon.data };
	}
});

const screen = new Screen({ three: THREE, fov: 50, near: 1, far: 1000 });
screen.renderer.shadowMap.enabled = true;
screen.camera.position.z = 9;

const cameraOrtho = new THREE.OrthographicCamera(
	-doc.w * 0.5,
	doc.w * 0.5,
	doc.h * 0.5,
	-doc.h * 0.5,
	-10,
	10,
);
cameraOrtho.position.z = 5;

const controls = new OrbitControls(screen.camera, doc as unknown as HTMLElement);
controls.update();

let mesh: THREE.Object3D | null = null;
populateScene(screen.scene, (m) => {
	mesh = m;
});

const scenePost = new THREE.Scene();

let isSwap = false;
let modeGrayscale = 0;
let modeHue = 0;
let numColors = 9;

const rawPalette0 = generatePalette(hueModes[modeHue], numColors);
let palette = rawPalette0.map((c) => new THREE.Color(...c));

const fragmentShader = readFileSync('post.glsl').toString();
let materialPost = createPostMaterial(
	THREE,
	numColors,
	isSwap,
	modeGrayscale,
	palette,
	fragmentShader,
);

let rt: THREE.WebGLRenderTarget | null = createRenderTarget(THREE, materialPost, doc.w, doc.h);

let quadPost = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialPost);
scenePost.add(quadPost);

const quadHelp = new THREE.Mesh(
	new THREE.PlaneGeometry(256, 256),
	new THREE.MeshBasicMaterial({
		side: THREE.CullFaceFront,
		depthTest: false,
		depthWrite: false,
		transparent: true,
		map: new THREE.TextureLoader().load('textures/help.png'),
	}),
);
quadHelp.position.set(doc.w * 0.5 - 128, -doc.h * 0.5 + 128, 1);
scenePost.add(quadHelp);

let colorQuads = createColorQuads(THREE, scenePost, palette, isSwap);

const setPalette = (newValue: THREE.Color[]): void => {
	palette = newValue;
	materialPost.uniforms.colors.value = palette;
	if (palette.length === colorQuads.length) {
		for (let i = 0; i < palette.length; i++) {
			const color = palette[i];
			colorQuads[i].material.uniforms.color.value = color;
		}
	} else {
		if (colorQuads) {
			for (const q of colorQuads) {
				scenePost.remove(q);
			}
		}
		colorQuads = createColorQuads(THREE, scenePost, palette, isSwap);
	}
};

const setModeGrayscale = (newValue: number): void => {
	modeGrayscale = isSwap && !newValue ? 1 : newValue;

	if (modeGrayscale === 1) {
		console.log('Grayscale mode: Luminosity.');
	} else if (modeGrayscale === 2) {
		console.log('Grayscale mode: Lightness.');
	} else if (modeGrayscale === 3) {
		console.log('Grayscale mode: Average.');
	} else {
		console.log('Grayscale mode: OFF.');
	}

	materialPost.uniforms.modeGrayscale.value = modeGrayscale;
};

const setIsSwap = (newValue: boolean): void => {
	isSwap = newValue;

	if (isSwap && !modeGrayscale) {
		setModeGrayscale(1);
	} else if (!isSwap) {
		setModeGrayscale(0);
	}

	materialPost.uniforms.isSwap.value = isSwap;
	for (let i = 0; i < palette.length; i++) {
		colorQuads[i].visible = isSwap;
	}
};

const randomizePalette = (): void => {
	const rawPalette = generatePalette(hueModes[modeHue], numColors);
	const colorPalette = rawPalette.map((c) => new THREE.Color(...c));
	setPalette(colorPalette);
};

const setModeHue = (newValue: number): void => {
	modeHue = newValue;
	randomizePalette();
};

const setNumColors = (newValue: number): void => {
	if (numColors === newValue) {
		return;
	}
	numColors = newValue;

	const rawPalette = generatePalette(hueModes[modeHue], numColors);
	const colorPalette = rawPalette.map((c) => new THREE.Color(...c));
	materialPost = createPostMaterial(
		THREE,
		numColors,
		isSwap,
		modeGrayscale,
		colorPalette,
		fragmentShader,
	);
	materialPost.uniforms.t.value = rt?.texture ?? null;

	scenePost.remove(quadPost);
	quadPost = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialPost);
	scenePost.add(quadPost);

	randomizePalette();
};

doc.on('keydown', (event) => {
	const e = event as { keyCode: number };
	if (e.keyCode === glfw.KEY_P) {
		randomizePalette();
		return;
	}
	if (e.keyCode === glfw.KEY_M) {
		setModeHue((modeHue + 1) % hueModes.length);
		return;
	}
	if (e.keyCode === glfw.KEY_S) {
		setIsSwap(!isSwap);
		return;
	}
	if (e.keyCode === glfw.KEY_G) {
		setModeGrayscale((modeGrayscale + 1) % 4);
		return;
	}
	if (e.keyCode === extraCodes[glfw.KEY_EQUAL]) {
		setNumColors(Math.min(16, numColors + 1));
		return;
	}
	if (e.keyCode === extraCodes[glfw.KEY_MINUS]) {
		setNumColors(Math.max(2, numColors - 1));
		return;
	}
	if (e.keyCode === glfw.KEY_H || e.keyCode === extraCodes[glfw.KEY_F1]) {
		quadHelp.visible = !quadHelp.visible;
	}
});

debugShaders(screen.renderer, false);

doc.on('resize', () => {
	cameraOrtho.left = -doc.w * 0.5;
	cameraOrtho.right = doc.w * 0.5;
	cameraOrtho.top = doc.h * 0.5;
	cameraOrtho.bottom = -doc.h * 0.5;
	cameraOrtho.updateProjectionMatrix();

	quadHelp.position.set(doc.w * 0.5 - 128, -doc.h * 0.5 + 128, 1);

	if (rt) {
		rt.dispose();
		rt = null;
	}
	rt = createRenderTarget(THREE, materialPost, doc.w, doc.h);
});

const render = (): void => {
	const rtOld = screen.renderer.getRenderTarget();
	screen.renderer.setRenderTarget(rt);
	screen.draw();
	screen.renderer.setRenderTarget(rtOld);

	screen.renderer.render(scenePost, cameraOrtho);
};

let prevTime = Date.now();
let frames = 0;

loop((now) => {
	controls.update();

	if (mesh) {
		mesh.rotation.y = now * 0.00005;
	}

	render();

	if (!IS_PERF_MODE) {
		return;
	}

	frames++;
	if (now >= prevTime + 2000) {
		console.log('FPS:', Math.floor((frames * 1000) / (now - prevTime)));
		prevTime = now;
		frames = 0;
	}
});
