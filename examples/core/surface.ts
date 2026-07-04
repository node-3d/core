import * as three from 'three';

import { Points, Rect, Screen, Surface, gl, init } from '@node-3d/core';

const { loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Surface',
});

const VBO_SIZE = 10000;

const screen = new Screen({ three });
loop(() => screen.draw());

screen.camera.position.z = 400;

const rect1 = new Rect({ screen, pos: [-500, -500], size: [1000, 1000] });
(rect1.mat as three.MeshBasicMaterial).color.setRGB(1, 0, 0);

const surface = new Surface({ screen });
const surfaceScreen = surface as unknown as Screen;
surface.camera.position.z = 400;

const rect2 = new Rect({ screen: surfaceScreen, pos: [-500, -500], size: [1000, 1000] });
(rect2.mat as three.MeshBasicMaterial).color.setRGB(0, 1, 0);

const vertices = [];
const colors = [];
for (let i = VBO_SIZE * 3; i > 0; i--) {
	vertices.push(Math.random() * 600 - 300);
	colors.push(Math.random());
}

const pos = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pos);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const rgb = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rgb);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

const points = new Points({
	screen: surfaceScreen,
	count: VBO_SIZE,
	attrs: {
		position: {
			vbo: pos,
			items: 3,
		},
		color: {
			vbo: rgb,
			items: 3,
		},
	},
});

let isRotating = false;
const mouse = { x: 0, y: 0 };

screen.on('mousedown', () => {
	isRotating = true;
});
screen.on('mouseup', () => {
	isRotating = false;
});

screen.on('mousemove', (e) => {
	const dx = mouse.x - e.x;
	const dy = mouse.y - e.y;

	mouse.x = e.x;
	mouse.y = e.y;

	if (!isRotating) {
		return;
	}

	points.mesh.rotation.y += dx * 0.001;
	points.mesh.rotation.x += dy * 0.001;

	surface.pos = surface.pos.plused([-dx, dy]);
});
