import * as THREE from 'three';
import { init, addThreeHelpers, gl, Screen } from '@node-3d/core';
import type { TCore3D, TWebgl } from '@node-3d/core';
import { debugShaders } from '../../utils/debug-shaders.ts';

type TInitResult = {
	doc: TCore3D['doc'],
	screen: InstanceType<typeof Screen>,
	loop: TCore3D['loop'],
	gl: TWebgl,
};

export const initCommon = (isPerf: boolean, title: string): TInitResult => {
	const {
		doc, loop,
	} = init({
		isGles3: true,
		isWebGL2: true,
		autoEsc: true,
		autoFullscreen: true,
		title,
		vsync: !isPerf,
	});
	addThreeHelpers(THREE);
	
	const screen = new Screen({ three: THREE, fov: 75, near: 1, far: 2000 });
	screen.camera.position.z = 350;
	
	debugShaders(screen.renderer, true);
	
	// screen.scene.background = new THREE.Color(0x87ceeb);
	// screen.scene.background = new THREE.Color(0xffffff);
	// screen.scene.background = new THREE.Color(0x0);
	// screen.scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);
	
	return {
		doc, screen, loop, gl,
	};
};
