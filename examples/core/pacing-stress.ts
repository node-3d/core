import * as THREE from 'three';
import { Screen, addThreeHelpers, init } from '@node-3d/core';

type TStats = {
	frames: number;
	startedAt: number;
	previousWallAt: number;
	previousTimelineAt: number;
	wallTotal: number;
	wallMin: number;
	wallMax: number;
	timelineTotal: number;
	timelineMin: number;
	timelineMax: number;
	workTotal: number;
	workMin: number;
	workMax: number;
	overTarget: number;
};

type TKeyboardEvent = {
	code?: string;
};

type TMouseMoveEvent = {
	movementX?: unknown;
	movementY?: unknown;
};

const MOVE_SPEED = 26;
const BOOST_MULTIPLIER = 4;
const MOUSE_SENSITIVITY = 0.002;
const MIN_PITCH = -Math.PI / 2 + 0.01;
const MAX_PITCH = Math.PI / 2 - 0.01;

const readNumberArg = (name: string, fallback: number): number => {
	const prefix = `--${name}=`;
	const arg = process.argv.find((item) => item.startsWith(prefix));
	if (!arg) {
		return fallback;
	}

	const value = Number(arg.slice(prefix.length));
	return Number.isFinite(value) ? value : fallback;
};

const readVsyncArg = (): boolean | number => {
	const arg = process.argv.find((item) => item.startsWith('--vsync='));
	if (!arg) {
		return true;
	}

	const value = arg.slice('--vsync='.length);
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}

	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : true;
};

const burnCpu = (ms: number): void => {
	if (ms <= 0) {
		return;
	}

	const until = performance.now() + ms;
	while (performance.now() < until) {
		/* deliberate overload */
	}
};

const resetStats = (stats: TStats, now: number): void => {
	stats.frames = 0;
	stats.startedAt = now;
	stats.wallTotal = 0;
	stats.wallMin = Number.POSITIVE_INFINITY;
	stats.wallMax = 0;
	stats.timelineTotal = 0;
	stats.timelineMin = Number.POSITIVE_INFINITY;
	stats.timelineMax = 0;
	stats.workTotal = 0;
	stats.workMin = Number.POSITIVE_INFINITY;
	stats.workMax = 0;
	stats.overTarget = 0;
};

const count = Math.max(1, Math.floor(readNumberArg('count', 300)));
const cpuMs = Math.max(0, readNumberArg('cpu-ms', 0));
const maxFrames = Math.max(1, readNumberArg('max-frames', Number.POSITIVE_INFINITY));
const vsync = readVsyncArg();

const { doc, loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync, // default true
	mode: 'borderless',
	title: 'Pacing Stress',
});
addThreeHelpers(THREE);

const monitorRate = doc.getCurrentMonitor()?.rate || 60;
const targetMs = 1000 / monitorRate;

console.log('pacing-stress', {
	count,
	cpuMs,
	vsync,
	targetFps: monitorRate,
	targetMs: +targetMs.toFixed(3),
	controls: 'mouse look, WASD move, Space up, Ctrl/C down, Shift boost',
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20242b);

const camera = new THREE.PerspectiveCamera(60, doc.w / doc.h, 0.1, 2000);
const screen = new Screen({ THREE, camera, scene });

scene.add(new THREE.AmbientLight(0x909090, 1.5));

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(4, 8, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0x7dd3fc, 1.25);
fill.position.set(-5, -2, -3);
scene.add(fill);

const group = new THREE.Group();
scene.add(group);

const geometry = new THREE.TorusKnotGeometry(0.44, 0.13, 64, 8, 2, 3);
const materials = [0xffdd66, 0x7dd3fc, 0xc084fc, 0x86efac, 0xfca5a5].map(
	(color) =>
		new THREE.MeshStandardMaterial({
			color,
			roughness: 0.55,
			metalness: 0.08,
		}),
);

const meshes: THREE.Mesh[] = [];
const side = Math.ceil(Math.sqrt(count));
const spacing = 1.5;
const half = ((side - 1) * spacing) / 2;
scene.add(new THREE.GridHelper(side * spacing, side, 0x56616f, 0x303844));

for (let i = 0; i < count; i++) {
	const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
	const x = (i % side) * spacing - half;
	const z = Math.floor(i / side) * spacing - half;
	mesh.position.set(x, Math.sin(i * 0.37) * 0.6, z);
	mesh.rotation.set(i * 0.17, i * 0.11, i * 0.07);
	group.add(mesh);
	meshes.push(mesh);
}

camera.position.set(0, Math.max(5, side * spacing * 0.15), Math.max(15, side * spacing * 0.65));
camera.lookAt(0, 0, 0);

const pressedKeys = new Set<string>();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const movement = new THREE.Vector3();
let yaw = 0;
let pitch = -Math.atan2(camera.position.y, camera.position.z);
let shouldSkipNextMouseMove = true;

const getEventKey = (event: TKeyboardEvent): string | null =>
	typeof event.code === 'string' ? event.code : null;

const updateCameraRotation = (): void => {
	camera.rotation.set(pitch, yaw, 0, 'YXZ');
};

const captureMouse = (): void => {
	shouldSkipNextMouseMove = true;
	doc.setPointerCapture();
};

const updateSpectator = (dt: number): void => {
	const speed =
		MOVE_SPEED *
		(pressedKeys.has('Shift') || pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight')
			? BOOST_MULTIPLIER
			: 1);

	camera.getWorldDirection(forward);
	right.crossVectors(forward, up).normalize();
	movement.set(0, 0, 0);

	if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) {
		movement.add(forward);
	}
	if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) {
		movement.sub(forward);
	}
	if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) {
		movement.add(right);
	}
	if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) {
		movement.sub(right);
	}
	if (pressedKeys.has('Space')) {
		movement.add(up);
	}
	if (
		pressedKeys.has('ControlLeft') ||
		pressedKeys.has('ControlRight') ||
		pressedKeys.has('Control') ||
		pressedKeys.has('KeyC')
	) {
		movement.sub(up);
	}

	if (movement.lengthSq() > 0) {
		camera.position.addScaledVector(movement.normalize(), speed * dt);
	}
};

const recordFrame = (
	statsCurrent: TStats,
	wallGap: number,
	timelineGap: number,
	workMs: number,
): void => {
	statsCurrent.frames++;
	statsCurrent.wallTotal += wallGap;
	statsCurrent.wallMin = Math.min(statsCurrent.wallMin, wallGap);
	statsCurrent.wallMax = Math.max(statsCurrent.wallMax, wallGap);
	statsCurrent.timelineTotal += timelineGap;
	statsCurrent.timelineMin = Math.min(statsCurrent.timelineMin, timelineGap);
	statsCurrent.timelineMax = Math.max(statsCurrent.timelineMax, timelineGap);
	statsCurrent.workTotal += workMs;
	statsCurrent.workMin = Math.min(statsCurrent.workMin, workMs);
	statsCurrent.workMax = Math.max(statsCurrent.workMax, workMs);
	if (workMs > targetMs) {
		statsCurrent.overTarget++;
	}
};

const printStats = (statsCurrent: TStats, elapsed: number): void => {
	console.log('stress', {
		fps: Math.round((statsCurrent.frames * 1000) / elapsed),
		wallAvgMs: +(statsCurrent.wallTotal / statsCurrent.frames).toFixed(3),
		wallMinMs: +statsCurrent.wallMin.toFixed(3),
		wallMaxMs: +statsCurrent.wallMax.toFixed(3),
		timelineAvgMs: +(statsCurrent.timelineTotal / statsCurrent.frames).toFixed(3),
		timelineMinMs: +statsCurrent.timelineMin.toFixed(3),
		timelineMaxMs: +statsCurrent.timelineMax.toFixed(3),
		workAvgMs: +(statsCurrent.workTotal / statsCurrent.frames).toFixed(3),
		workMinMs: +statsCurrent.workMin.toFixed(3),
		workMaxMs: +statsCurrent.workMax.toFixed(3),
		overTarget: statsCurrent.overTarget,
	});
};

doc.on('mousedown', () => {
	captureMouse();
});

doc.on('mousemove', (event) => {
	const mouseEvent = event as TMouseMoveEvent;
	const movementX = typeof mouseEvent.movementX === 'number' ? mouseEvent.movementX : 0;
	const movementY = typeof mouseEvent.movementY === 'number' ? mouseEvent.movementY : 0;

	if (shouldSkipNextMouseMove) {
		shouldSkipNextMouseMove = false;
		return;
	}

	yaw -= movementX * MOUSE_SENSITIVITY;
	pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch - movementY * MOUSE_SENSITIVITY));
	updateCameraRotation();
});

doc.on('keydown', (event) => {
	const key = getEventKey(event as TKeyboardEvent);
	if (key) {
		pressedKeys.add(key);
	}
});

doc.on('keyup', (event) => {
	const key = getEventKey(event as TKeyboardEvent);
	if (key) {
		pressedKeys.delete(key);
	}
});

doc.on('resize', () => {
	camera.aspect = doc.w / doc.h;
	camera.updateProjectionMatrix();
	screen.renderer.setSize(doc.w, doc.h, false);
});

updateCameraRotation();
captureMouse();

const stats: TStats = {
	frames: 0,
	startedAt: 0,
	previousWallAt: 0,
	previousTimelineAt: 0,
	wallTotal: 0,
	wallMin: Number.POSITIVE_INFINITY,
	wallMax: 0,
	timelineTotal: 0,
	timelineMin: Number.POSITIVE_INFINITY,
	timelineMax: 0,
	workTotal: 0,
	workMin: Number.POSITIVE_INFINITY,
	workMax: 0,
	overTarget: 0,
};

let totalFrames = 0;
let hasPreviousFrame = false;

loop((timelineNow) => {
	const wallStartedAt = performance.now();

	if (!stats.startedAt) {
		stats.startedAt = wallStartedAt;
		stats.previousWallAt = wallStartedAt;
		stats.previousTimelineAt = timelineNow;
	}

	const timelineDt = hasPreviousFrame
		? Math.min(0.1, (timelineNow - stats.previousTimelineAt) / 1000)
		: 0;
	updateSpectator(timelineDt);

	for (let i = 0; i < meshes.length; i++) {
		const mesh = meshes[i];
		mesh.rotation.x += (0.18 + (i % 7) * 0.006) * timelineDt;
		mesh.rotation.y += (0.24 + (i % 5) * 0.006) * timelineDt;
	}

	burnCpu(cpuMs);
	screen.draw();

	const wallEndedAt = performance.now();
	const wallGap = wallStartedAt - stats.previousWallAt;
	const timelineGap = timelineNow - stats.previousTimelineAt;
	const workMs = wallEndedAt - wallStartedAt;

	totalFrames++;

	if (hasPreviousFrame) {
		recordFrame(stats, wallGap, timelineGap, workMs);
	} else {
		hasPreviousFrame = true;
	}

	stats.previousWallAt = wallStartedAt;
	stats.previousTimelineAt = timelineNow;

	const elapsed = wallStartedAt - stats.startedAt;
	if (elapsed >= 5000 && stats.frames > 0) {
		printStats(stats, elapsed);
		resetStats(stats, wallStartedAt);
	}

	if (totalFrames >= maxFrames) {
		process.exit(0);
	}
});
