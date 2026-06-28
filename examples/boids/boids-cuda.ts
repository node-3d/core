// https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html
// https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__OPENGL.html

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
	Ctx,
	Device,
	getDeviceCount,
	memVBO,
	moduleRuntimeCompile,
	prepareArguments,
} from '@node-3d/cuda';
import { initCommon } from './utils/init-common.ts';
import { loopCommon } from './utils/loop-common.ts';
import { BirdMeshCuda } from './cuda/bird-mesh-cuda.ts';
import { fillPositionAndPhase, fillVelocity } from './utils/fill-data.ts';

const BIRDS: number = 128 * 128; // 16384
const BOUNDS: number = 800;
const IS_PERF_MODE: boolean = true;
const THREADS_PER_BLOCK: number = 256;

const boidsSrc: string = readFileSync('cuda/boids.cu').toString();
const { screen, doc, gl } = initCommon(IS_PERF_MODE, 'Boids CUDA');

if (getDeviceCount() === 0) {
	throw new Error('No CUDA devices available');
}

const device = new Device(0);
const context = new Ctx(0, device);
const birdMesh = new BirdMeshCuda(BIRDS);
screen.scene.add(birdMesh);

const controls = new OrbitControls(screen.camera, doc as unknown as HTMLElement);
controls.update();

const { offsets, velocity } = birdMesh.vbos;
fillPositionAndPhase(offsets.array, BOUNDS);
gl.bindBuffer(gl.ARRAY_BUFFER, offsets.vbo);
gl.bufferData(gl.ARRAY_BUFFER, offsets.array, gl.STATIC_DRAW);

fillVelocity(velocity.array);
gl.bindBuffer(gl.ARRAY_BUFFER, velocity.vbo);
gl.bufferData(gl.ARRAY_BUFFER, velocity.array, gl.STATIC_DRAW);
gl.finish();

const initContextError = context.setCurrent();

if (initContextError !== 0) {
	throw new Error(`Failed to set CUDA context current: ${initContextError}`);
}

const memPos = memVBO();
const memVel = memVBO();
memPos.initVBO(gl.extractId(offsets.vbo));
memVel.initVBO(gl.extractId(velocity.vbo));

const ptxPath = join(tmpdir(), '@node-3d/cuda-boids.ptx').replaceAll('\\', '/');
const module = moduleRuntimeCompile('boids.cu', boidsSrc, ptxPath);
const compileLog = module.log ?? '';

if (
	(typeof module.error === 'number' && module.error !== 0) ||
	compileLog.includes('error:')
) {
	throw new Error(`Failed to compile CUDA boids module: ${compileLog || 'no compiler log'}`);
}

const kernelUpdate = module.getFunction('update');

if (typeof kernelUpdate.error === 'number' && kernelUpdate.error !== 0) {
	throw new Error(`Failed to load CUDA boids kernel: ${kernelUpdate.error}`);
}

const separation = 20.0;
const alignment = 20.0;
const cohesion = 20.0;
const gridSize = Math.ceil(BIRDS / THREADS_PER_BLOCK);
const kernelArgs = prepareArguments([
	{ type: 'Uint32', value: BIRDS },
	{ type: 'Float32', value: 0 },
	{ type: 'Float32', value: BOUNDS },
	{ type: 'Float32', value: 0 },
	{ type: 'Float32', value: 0 },
	{ type: 'Float32', value: separation },
	{ type: 'Float32', value: alignment },
	{ type: 'Float32', value: cohesion },
	{ type: 'DevicePtr', value: 0 },
	{ type: 'DevicePtr', value: 0 },
]);
const maxFramesArg = process.argv.find(arg => arg.startsWith('--max-frames='));
const maxFrames = maxFramesArg ? Number.parseInt(maxFramesArg.slice('--max-frames='.length), 10) : 0;
let frameCount = 0;

loopCommon(IS_PERF_MODE, (_now, delta, mouse) => {
	controls.update();

	const currentError = context.setCurrent();

	if (currentError !== 0) {
		throw new Error(`Failed to set CUDA context current: ${currentError}`);
	}

	kernelArgs.writeFloatLE(delta, 4);
	kernelArgs.writeFloatLE(mouse[0] * BOUNDS, 12);
	kernelArgs.writeFloatLE(mouse[1] * BOUNDS, 16);

	gl.finish();
	
	// NVIDIA requires CUDA to map graphics resources before CUDA use and unmap before GL reuse.
	// https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__INTEROP.html
	memPos.regVBO(gl.extractId(offsets.vbo));
	memVel.regVBO(gl.extractId(velocity.vbo));
	
	try {
		kernelArgs.writeBigUInt64LE(BigInt(memPos.devicePtr), 32);
		kernelArgs.writeBigUInt64LE(BigInt(memVel.devicePtr), 40);
		
		const launchError = kernelUpdate.launchKernel(
			[gridSize, 1, 1],
			[THREADS_PER_BLOCK, 1, 1],
			kernelArgs,
		);
		
		if (launchError !== 0) {
			throw new Error(`Failed to launch CUDA boids kernel on frame ${frameCount}: ${launchError}`);
		}
		
		const syncError = context.synchronize();
		
		if (syncError !== 0) {
			throw new Error(`Failed to synchronize CUDA boids kernel: ${syncError}`);
		}
	} finally {
		memPos.unregVBO();
		memVel.unregVBO();
	}

	screen.draw();

	frameCount++;
	if (maxFrames > 0 && frameCount >= maxFrames) {
		process.exit(0);
	}
});
