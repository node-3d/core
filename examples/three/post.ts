// Based on https://threejs.org/examples/?q=postprocess#webgl_postprocessing_advanced

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { Image, addThreeHelpers, gl, init } from '@node-3d/core';
import {
	BloomPass,
	ClearMaskPass,
	DotScreenPass,
	EffectComposer,
	FilmPass,
	MaskPass,
	RenderPass,
	ShaderPass,
	TexturePass,
} from './postprocessing.ts';
import {
	BleachBypassShader,
	ColorifyShader,
	HorizontalBlurShader,
	SepiaShader,
	VerticalBlurShader,
	VignetteShader,
} from './post-shaders.ts';

const IS_PERF_MODE = true;

const cwd = import.meta.dirname;

const { doc, loop } = init({
	isGles3: true,
	// isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: !IS_PERF_MODE,
	title: 'Postprocessing',
});
const window = doc;
addThreeHelpers(THREE);

const icon = new Image();
icon.src = 'textures/three.png';
icon.on('load', () => {
	if (icon.data) {
		doc.icon = { width: icon.width, height: icon.height, data: icon.data };
	}
});

// --- classical theree js example below

const container = (doc.getElementById as unknown as (id: string) => unknown)('container') as {
	appendChild: (child: unknown) => void;
};

let composerScene: EffectComposer | null = null;
let composer1: EffectComposer | null = null;
let composer2: EffectComposer | null = null;
let composer3: EffectComposer | null = null;
let composer4: EffectComposer | null = null;

let renderer = new THREE.WebGLRenderer({
	context: gl as unknown as WebGLRenderingContext,
	antialias: true,
	canvas: doc as unknown as HTMLCanvasElement,
	alpha: true,
});
let mesh: THREE.Mesh | null = null;

const width = window.innerWidth || 2;
const height = window.innerHeight || 2;

let halfWidth = width / 2;
let halfHeight = height / 2;

let renderScene: TexturePass | null = null;

const delta = 0.01;

const cameraOrtho = new THREE.OrthographicCamera(
	-halfWidth,
	halfWidth,
	halfHeight,
	-halfHeight,
	-10000,
	10000,
);
cameraOrtho.position.z = 100;

const cameraPerspective = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
cameraPerspective.position.z = 900;

//

const sceneModel = new THREE.Scene();
const sceneBG = new THREE.Scene();

//

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(0, -0.1, 1).normalize();
sceneModel.add(directionalLight);

const diffuseMap = new THREE.TextureLoader().load('textures/pz.jpg');
// diffuseMap.colorSpace = THREE.SRGBColorSpace;

const materialColor = new THREE.MeshBasicMaterial({
	map: diffuseMap,
	depthTest: false,
});

const quadBG = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialColor);
quadBG.position.z = -500;
quadBG.scale.set(width, height, 1);
sceneBG.add(quadBG);

//

const sceneMask = new THREE.Scene();

const quadMask = new THREE.Mesh(
	new THREE.PlaneGeometry(1, 1),
	new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
);
quadMask.position.z = -300;
quadMask.scale.set(width / 2, height / 2, 1);
sceneMask.add(quadMask);

//

// When switching from fullscreen and back, reset renderer to update VAO/FBO objects
const resetRenderer = (): undefined => {
	if (renderer) {
		renderer.dispose();
	}

	renderer = new THREE.WebGLRenderer({
		context: gl as unknown as WebGLRenderingContext,
		antialias: true,
		canvas: doc as unknown as HTMLCanvasElement,
		alpha: true,
	});

	renderer.setPixelRatio(doc.devicePixelRatio);
	renderer.setSize(doc.width, doc.height);
	renderer.autoClear = false;

	if (composerScene) {
		composerScene.renderer = renderer;
		if (composer1) {
			composer1.renderer = renderer;
		}
		if (composer2) {
			composer2.renderer = renderer;
		}
		if (composer3) {
			composer3.renderer = renderer;
		}
		if (composer4) {
			composer4.renderer = renderer;
		}
	}
	return undefined;
};

resetRenderer();
doc.on('mode', resetRenderer);

//

container.appendChild(renderer.domElement);

//

const shaderBleach = BleachBypassShader;
const shaderSepia = SepiaShader;
const shaderVignette = VignetteShader;

const effectBleach = new ShaderPass(shaderBleach);
const effectSepia = new ShaderPass(shaderSepia);
const effectVignette = new ShaderPass(shaderVignette);
// const gammaCorrection = new ShaderPass(GammaCorrectionShader);

effectBleach.uniforms['opacity'].value = 0.95;

effectSepia.uniforms['amount'].value = 0.9;

effectVignette.uniforms['offset'].value = 0.95;
effectVignette.uniforms['darkness'].value = 1.6;

const effectBloom = new BloomPass(0.5);
const effectFilm = new FilmPass(0.35);
const effectFilmBW = new FilmPass(0.35, true);
const effectDotScreen = new DotScreenPass(new THREE.Vector2(0, 0), 0.5, 0.8);

const effectHBlur = new ShaderPass(HorizontalBlurShader);
const effectVBlur = new ShaderPass(VerticalBlurShader);
effectHBlur.uniforms['h'].value = 2 / (width / 2);
effectVBlur.uniforms['v'].value = 2 / (height / 2);

const effectColorify1 = new ShaderPass(ColorifyShader);
const effectColorify2 = new ShaderPass(ColorifyShader);
effectColorify1.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.8, 0.8));
effectColorify2.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.75, 0.5));

const clearMask = new ClearMaskPass();
const renderMask = new MaskPass(sceneModel, cameraPerspective);
const renderMaskInverse = new MaskPass(sceneModel, cameraPerspective);

renderMaskInverse.inverse = true;

//

const rtParameters = { stencilBuffer: true };
const rtWidth = width / 2;
const rtHeight = height / 2;

//

composerScene = new EffectComposer(
	renderer,
	new THREE.WebGLRenderTarget(rtWidth * 2, rtHeight * 2, rtParameters),
);

const renderBackground = new RenderPass(sceneBG, cameraOrtho);
const renderModel = new RenderPass(sceneModel, cameraPerspective);

renderModel.clear = false;

composerScene.addPass(renderBackground);
composerScene.addPass(renderModel);
composerScene.addPass(renderMaskInverse);
composerScene.addPass(effectHBlur);
composerScene.addPass(effectVBlur);
composerScene.addPass(clearMask);

//

renderScene = new TexturePass(composerScene.renderTarget2.texture);

//

composer1 = new EffectComposer(
	renderer,
	new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters),
);

composer1.addPass(renderScene);
// composer1.addPass(gammaCorrection);
composer1.addPass(effectFilmBW);
composer1.addPass(effectVignette);

//

composer2 = new EffectComposer(
	renderer,
	new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters),
);

composer2.addPass(renderScene);
// composer2.addPass(gammaCorrection);
composer2.addPass(effectDotScreen);
composer2.addPass(renderMask);
composer2.addPass(effectColorify1);
composer2.addPass(clearMask);
composer2.addPass(renderMaskInverse);
composer2.addPass(effectColorify2);
composer2.addPass(clearMask);
composer2.addPass(effectVignette);

//

composer3 = new EffectComposer(
	renderer,
	new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters),
);

composer3.addPass(renderScene);
// composer3.addPass(gammaCorrection);
composer3.addPass(effectSepia);
composer3.addPass(effectFilm);
composer3.addPass(effectVignette);

//

composer4 = new EffectComposer(
	renderer,
	new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters),
);

composer4.addPass(renderScene);
// composer4.addPass(gammaCorrection);
composer4.addPass(effectBloom);
composer4.addPass(effectFilm);
composer4.addPass(effectBleach);
composer4.addPass(effectVignette);

renderScene.uniforms['tDiffuse'].value = composerScene.renderTarget2.texture;

const onWindowResize = (): undefined => {
	halfWidth = window.innerWidth / 2;
	halfHeight = window.innerHeight / 2;

	cameraPerspective.aspect = window.innerWidth / window.innerHeight;
	cameraPerspective.updateProjectionMatrix();

	cameraOrtho.left = -halfWidth;
	cameraOrtho.right = halfWidth;
	cameraOrtho.top = halfHeight;
	cameraOrtho.bottom = -halfHeight;

	cameraOrtho.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	composerScene?.setSize(halfWidth * 2, halfHeight * 2);

	composer1?.setSize(halfWidth, halfHeight);
	composer2?.setSize(halfWidth, halfHeight);
	composer3?.setSize(halfWidth, halfHeight);
	composer4?.setSize(halfWidth, halfHeight);

	if (renderScene && composerScene) {
		renderScene.uniforms['tDiffuse'].value = composerScene.renderTarget2.texture;
	}

	quadBG.scale.set(window.innerWidth, window.innerHeight, 1);
	quadMask.scale.set(window.innerWidth / 2, window.innerHeight / 2, 1);
};

const createMesh = (geometry: THREE.BufferGeometry, scene: THREE.Scene, scale: number): void => {
	const diffuseMap = new THREE.TextureLoader().load(`${cwd}/textures/Map-COL.jpg`);
	// diffuseMap.colorSpace = THREE.SRGBColorSpace;

	const mat2 = new THREE.MeshPhongMaterial({
		color: 0xcbcbcb,
		specular: 0x080808,
		shininess: 20,
		map: diffuseMap,
		normalMap: new THREE.TextureLoader().load(
			`${cwd}/textures/Infinite-Level_02_Tangent_SmoothUV.jpg`,
		),
		normalScale: new THREE.Vector2(0.75, 0.75),
	});

	mesh = new THREE.Mesh(geometry, mat2);
	mesh.position.set(0, -50, 0);
	mesh.scale.set(scale, scale, scale);

	scene.add(mesh);
};

const loader = new GLTFLoader();
loader.load('models/LeePerrySmith.glb', (gltf) => {
	const model = gltf.scene.children[0] as THREE.Mesh<THREE.BufferGeometry>;
	createMesh(model.geometry, sceneModel, 100);
});

window.addEventListener('resize', onWindowResize);

let prevTime = Date.now();
let frames = 0;

loop((now) => {
	const timedRotation = now * 0.0004;

	if (mesh) {
		mesh.rotation.y = -timedRotation;
	}

	renderer.setViewport(0, 0, halfWidth, halfHeight);
	composerScene?.render(delta);

	renderer.setViewport(0, 0, halfWidth, halfHeight);
	composer1?.render(delta);

	renderer.setViewport(halfWidth, 0, halfWidth, halfHeight);
	composer2?.render(delta);

	renderer.setViewport(0, halfHeight, halfWidth, halfHeight);
	composer3?.render(delta);

	renderer.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
	composer4?.render(delta);

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
