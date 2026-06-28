import * as three from 'three';

import { Lines, Screen, gl, init } from '@node-3d/core';


const { loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Lines',
});

const VBO_SIZE = 10;

const screen = new Screen({ three });

loop(() => screen.draw());

screen.camera.position.z = 300;


const vertices1 = [];
const colors1 = [];
for (let i = VBO_SIZE; i > 0; i--) {
	vertices1.push( Math.random() * 200 - 100, Math.random() * 70 - 120, Math.random() * 200 - 100 );
	colors1.push( Math.random(), Math.random(), Math.random() );
}

const pos1 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pos1);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices1), gl.STATIC_DRAW);

const rgb1 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rgb1);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors1), gl.STATIC_DRAW);

const lines1 = new Lines({
	screen,
	count : VBO_SIZE,
	attrs : {
		position: { vbo: pos1, items: 3 },
		color : { vbo: rgb1, items: 3 },
	},
});


const vertices2 = [];
const colors2 = [];
for (let i = VBO_SIZE; i > 0; i--) {
	vertices2.push( Math.random() * 200 - 100, Math.random() * 70 - 50, Math.random() * 200 - 100 );
	colors2.push( Math.random(), Math.random(), Math.random() );
}

const pos2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pos2);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices2), gl.STATIC_DRAW);

const rgb2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rgb2);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.STATIC_DRAW);

const lines2 = new Lines({
	screen,
	mode  : 'segments',
	count : VBO_SIZE,
	attrs : {
		position: { vbo: pos2, items: 3 },
		color: { vbo: rgb2, items: 3 },
	},
});


const vertices3 = [];
const colors3 = [];
for (let i = VBO_SIZE; i > 0; i--) {
	vertices3.push( Math.random() * 200 - 100, Math.random() * 70 + 30, Math.random() * 200 - 100 );
	colors3.push( Math.random(), Math.random(), Math.random() );
}

const pos3 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pos3);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices3), gl.STATIC_DRAW);

const rgb3 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rgb3);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors3), gl.STATIC_DRAW);

const lines3 = new Lines({
	screen,
	mode  : 'loop',
	count : VBO_SIZE,
	attrs : {
		position: { vbo: pos3, items: 3 },
		color: { vbo: rgb3, items: 3 },
	},
});

let isMoving = false;
const mouse = { x: 0, y: 0 };

screen.on('mousedown', () => { isMoving = true; });
screen.on('mouseup', () => { isMoving = false; });


screen.on('mousemove', (e) => {
	const dx = mouse.x - e.x;
	const dy = mouse.y - e.y;
	
	mouse.x = e.x;
	mouse.y = e.y;
	
	if (!isMoving) {
		return;
	}
	
	lines1.mesh.rotation.y += dx * 0.001;
	lines1.mesh.rotation.x += dy * 0.001;
	
	lines2.mesh.rotation.y += dx * 0.001;
	lines2.mesh.rotation.x += dy * 0.001;
	
	lines3.mesh.rotation.y += dx * 0.001;
	lines3.mesh.rotation.x += dy * 0.001;
});
