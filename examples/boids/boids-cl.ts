// https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html
// http://web.engr.oregonstate.edu/~mjb/cs575/Handouts/opencl.opengl.vbo.1pp.pdf
// https://developer.download.nvidia.com/compute/DevZone/docs/html/OpenCL/doc/OpenCL_Best_Practices_Guide.pdf

import { readFileSync } from 'node:fs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as cl from '@node-3d/opencl';
import { initCommon } from './utils/init-common.ts';
import { loopCommon } from './utils/loop-common.ts';
import { BirdMeshCl } from './cl/bird-mesh-cl.ts';
import { fillPositionAndPhase, fillVelocity } from './utils/fill-data.ts';

const BIRDS: number = 128 * 128; // 16384
const BOUNDS: number = 800;
const IS_PERF_MODE: boolean = true;

const boidsSrc: string = readFileSync('cl/boids.cl').toString();
const { screen, doc, gl } = initCommon(IS_PERF_MODE, 'Boids CL');
const { platform, device } = cl.quickStart(!true);

const context = cl.createContext(
	[
		cl.GL_CONTEXT_KHR,
		doc.platformContext,
		cl.WGL_HDC_KHR,
		doc.platformDevice,
		cl.CONTEXT_PLATFORM,
		platform,
	],
	[device],
);
const queue = cl.createCommandQueue(context, device);

const birdMesh = new BirdMeshCl(BIRDS);
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

const memPos = cl.createFromGLBuffer(context, cl.MEM_READ_WRITE, gl.extractId(offsets.vbo));
const memVel = cl.createFromGLBuffer(context, cl.MEM_READ_WRITE, gl.extractId(velocity.vbo));

// Create a program object
const program = cl.createProgramWithSource(context, boidsSrc);
cl.buildProgram(program, [device], `-cl-fast-relaxed-math -cl-mad-enable`);

const kernelUpdate = cl.createKernel(program, 'update');

const separation = 20.0;
const alignment = 20.0;
const cohesion = 20.0;
const maxFramesArg = process.argv.find((arg) => arg.startsWith('--max-frames='));
const maxFrames = maxFramesArg
	? Number.parseInt(maxFramesArg.slice('--max-frames='.length), 10)
	: 0;
let frameCount = 0;

cl.setKernelArg(kernelUpdate, 0, 'uint', BIRDS);
cl.setKernelArg(kernelUpdate, 1, 'float', 0.016); // dynamic
cl.setKernelArg(kernelUpdate, 2, 'float', BOUNDS);
cl.setKernelArg(kernelUpdate, 3, 'float', -10000); // dynamic
cl.setKernelArg(kernelUpdate, 4, 'float', -10000); // dynamic
cl.setKernelArg(kernelUpdate, 5, 'float', separation);
cl.setKernelArg(kernelUpdate, 6, 'float', alignment);
cl.setKernelArg(kernelUpdate, 7, 'float', cohesion);
cl.setKernelArg(kernelUpdate, 8, 'float*', memPos);
cl.setKernelArg(kernelUpdate, 9, 'float*', memVel);

loopCommon(IS_PERF_MODE, (_now, delta, mouse) => {
	controls.update();

	cl.setKernelArg(kernelUpdate, 1, 'float', delta);
	cl.setKernelArg(kernelUpdate, 3, 'float', mouse[0] * BOUNDS);
	cl.setKernelArg(kernelUpdate, 4, 'float', mouse[1] * BOUNDS);

	gl.finish();

	// Khronos requires acquiring GL objects before OpenCL use and releasing them before GL reuse.
	// https://registry.khronos.org/OpenCL/specs/unified/refpages/man/html/clEnqueueAcquireGLObjects.html
	// https://registry.khronos.org/OpenCL/specs/unified/refpages/man/html/clEnqueueReleaseGLObjects.html
	cl.enqueueAcquireGLObjects(queue, memPos);
	cl.enqueueAcquireGLObjects(queue, memVel);

	cl.enqueueNDRangeKernel(queue, kernelUpdate, 1, null, [BIRDS], [256]);

	cl.enqueueReleaseGLObjects(queue, memPos);
	cl.enqueueReleaseGLObjects(queue, memVel);
	cl.finish(queue);

	screen.draw();

	frameCount++;
	if (maxFrames > 0 && frameCount >= maxFrames) {
		process.exit(0);
	}
});
