import * as three from 'three';

import { Rect, Screen, init } from '@node-3d/core';


const { loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Rect',
});

const screen = new Screen({ three });
loop(() => screen.draw());

screen.camera.position.z = 500;

const rect = new Rect({ screen });

const mouse = { x: screen.w / 2, y: screen.h / 2 };

const paint = () => {
	const color = (rect.mat as three.MeshBasicMaterial).color;
	color.r = mouse.x / screen.w;
	color.g = mouse.y / screen.h;
	color.b = 1 - color.r * color.g;
};
paint();

let isMoving = false;

screen.on('mousedown', () => { isMoving = true; });
screen.on('mouseup', () => { isMoving = false; });

screen.on('mousemove', (e) => {
	const dx = mouse.x - e.x;
	const dy = mouse.y - e.y;
	
	mouse.x = e.x;
	mouse.y = e.y;
	
	paint();
	
	if (!isMoving) {
		return;
	}
	
	rect.pos = rect.pos.plused([-dx, dy]);
});
