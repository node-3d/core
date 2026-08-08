import type { TMouseMoveEvent } from '@node-3d/glfw';
import * as node3d from '@node-3d/core';
import { countFrame } from '../../utils/perf.ts';

export type TMouseNdc = readonly [x: number, y: number] | null;
export type TMouseWorld = readonly [x: number, y: number];

type TScreen = InstanceType<typeof node3d.Screen>;
type TCbLoop = (now: number, dt: number, mouse: TMouseNdc) => void;

const OFFSCREEN_MOUSE: TMouseWorld = [-10000, -10000];

export const projectMouseToZPlane = (screen: TScreen, mouse: TMouseNdc): TMouseWorld => {
	if (!mouse) {
		return OFFSCREEN_MOUSE;
	}

	const point = new screen.three.Vector3(mouse[0], mouse[1], 0.5).unproject(screen.camera);
	const direction = point.sub(screen.camera.position).normalize();

	if (Math.abs(direction.z) < 0.000001) {
		return OFFSCREEN_MOUSE;
	}

	const distance = -screen.camera.position.z / direction.z;
	if (!Number.isFinite(distance)) {
		return OFFSCREEN_MOUSE;
	}

	const world = screen.camera.position.clone().add(direction.multiplyScalar(distance));
	return [world.x, world.y];
};

export const loopCommon = (isPerf: boolean, cb: TCbLoop): (() => void) => {
	const { doc, loop } = node3d.init();

	let mouse: TMouseNdc = null;

	doc.on('mousemove', (event) => {
		const mouseEvent = event as TMouseMoveEvent;
		mouse = [
			(mouseEvent.clientX / window.innerWidth) * 2 - 1,
			-(mouseEvent.clientY / window.innerHeight) * 2 + 1,
		];
	});

	let last: number = performance.now();

	return loop((now: number) => {
		let delta = (now - last) / 1000;

		if (delta > 0.1) {
			delta = 0.1; // safety cap on large deltas
		}
		last = now;

		// oxlint-disable-next-line node/callback-return
		cb(now, delta, mouse);

		if (isPerf) {
			countFrame(now);
		}
	});
};
