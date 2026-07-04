// https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html

import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import type { Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initCommon } from './utils/init-common.ts';
import { fillPositionAndPhase, fillVelocity } from './utils/fill-data.ts';
import { loopCommon } from './utils/loop-common.ts';
import { BirdMesh } from './gl/bird-mesh.ts';

const IS_PERF_MODE: boolean = true;
const { screen, doc } = initCommon(IS_PERF_MODE, 'Boids GL');

const fragmentShaderPosition: string = readFileSync('gl/position-fs.glsl').toString();
const fragmentShaderVelocity: string = readFileSync('gl/velocity-fs.glsl').toString();

/* Texture size for simulation */
const WIDTH: number = 128; // 128^2 = 16384 birds. It ain't much, but it's honest work
const BIRDS: number = WIDTH * WIDTH;

const BOUNDS: number = 800;

type TPositionUniforms = {
	time: THREE.Uniform;
	delta: THREE.Uniform;
};

type TVelocityUniforms = TPositionUniforms & {
	testing: THREE.Uniform;
	separationDistance: THREE.Uniform;
	alignmentDistance: THREE.Uniform;
	cohesionDistance: THREE.Uniform;
	freedomFactor: THREE.Uniform;
	predator: THREE.Uniform;
};

const controls = new OrbitControls(screen.camera, doc as unknown as HTMLElement);
controls.update();

const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, screen.renderer);
const dtPosition = gpuCompute.createTexture();
fillPositionAndPhase(dtPosition.image.data, BOUNDS);
const dtVelocity = gpuCompute.createTexture();
fillVelocity(dtVelocity.image.data);

const velocityVariable: Variable = gpuCompute.addVariable(
	'textureVelocity',
	fragmentShaderVelocity,
	dtVelocity,
);
const positionVariable: Variable = gpuCompute.addVariable(
	'texturePosition',
	fragmentShaderPosition,
	dtPosition,
);

gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

const positionUniforms: TPositionUniforms = positionVariable.material.uniforms as TPositionUniforms;
const velocityUniforms: TVelocityUniforms = velocityVariable.material.uniforms as TVelocityUniforms;

positionUniforms.delta = new THREE.Uniform(0.0);

velocityUniforms.delta = new THREE.Uniform(0.0);
velocityUniforms.separationDistance = new THREE.Uniform(20.0);
velocityUniforms.alignmentDistance = new THREE.Uniform(20.0);
velocityUniforms.cohesionDistance = new THREE.Uniform(20.0);
velocityUniforms.predator = new THREE.Uniform(new THREE.Vector3());

velocityVariable.material.defines['BOUNDS'] = BOUNDS.toFixed(2);
velocityVariable.wrapS = THREE.RepeatWrapping;
velocityVariable.wrapT = THREE.RepeatWrapping;
positionVariable.wrapS = THREE.RepeatWrapping;
positionVariable.wrapT = THREE.RepeatWrapping;

const error = gpuCompute.init();
if (error) {
	console.error(error);
}

const birdMesh = new BirdMesh(BIRDS, WIDTH);
screen.scene.add(birdMesh);

loopCommon(IS_PERF_MODE, (_now, delta, mouse) => {
	controls.update();

	positionUniforms.delta.value = delta;

	velocityUniforms.delta.value = delta;
	velocityUniforms.predator.value.set(mouse[0], mouse[1], 0);

	gpuCompute.compute();

	birdMesh.uniforms.texturePosition.value =
		gpuCompute.getCurrentRenderTarget(positionVariable).texture;
	birdMesh.uniforms.textureVelocity.value =
		gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

	screen.draw();
});
