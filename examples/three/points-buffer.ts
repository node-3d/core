import * as three from 'three';
import { Screen, gl, init } from '@node-3d/core';

console.log('https://threejs.org/examples/#webgl_points_random');

const { loop, doc } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
});

// --- Classical threejs example below

const camera = new three.PerspectiveCamera(75, doc.width / doc.height, 1, 3000);
const scene = new three.Scene();
const screen = new Screen({ three, camera, scene });
type TDocumentEventCallback = Parameters<typeof screen.document.addEventListener>[1];

const REAL_SIZE = 20000;

let particles: three.Points | null = null;
const materials: three.PointsMaterial[] = [];
let i = 0;
let h = 0;
let color: readonly [number, number, number] = [1, 1, 0.5];
let size = 5;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = screen.width / 2;
let windowHalfY = screen.height / 2;

let cloud: three.Points | null = null;


const onWindowResize = (): undefined => {
	windowHalfX = screen.width / 2;
	windowHalfY = screen.height / 2;
};

const onDocumentMouseMove: TDocumentEventCallback = (event) => {
	const mouseEvent = event as { clientX?: unknown; clientY?: unknown };
	if (typeof mouseEvent.clientX !== 'number' || typeof mouseEvent.clientY !== 'number') {
		return;
	}
	mouseX = mouseEvent.clientX - windowHalfX;
	mouseY = mouseEvent.clientY - windowHalfY;
};

type TTouchLikeEvent = {
	preventDefault?: () => void;
	touches?: readonly { pageX: number; pageY: number }[];
};

const onDocumentTouchStart: TDocumentEventCallback = (event) => {
	const touchEvent = event as TTouchLikeEvent;
	if (touchEvent.touches?.length === 1) {
		touchEvent.preventDefault?.();
		mouseX = touchEvent.touches[ 0 ].pageX - windowHalfX;
		mouseY = touchEvent.touches[ 0 ].pageY - windowHalfY;
	}
};

const onDocumentTouchMove: TDocumentEventCallback = (event) => {
	const touchEvent = event as TTouchLikeEvent;
	if (touchEvent.touches?.length === 1) {
		touchEvent.preventDefault?.();
		mouseX = touchEvent.touches[ 0 ].pageX - windowHalfX;
		mouseY = touchEvent.touches[ 0 ].pageY - windowHalfY;
	}
};


const addCloud = (): three.Points => {
	const geo = new three.BufferGeometry();
	geo.computeBoundingSphere = (() => {
		geo.boundingSphere = new three.Sphere(undefined, Infinity);
	});
	geo.computeBoundingSphere();
	geo.setDrawRange(0, 0);
	
	const vertices: number[] = [];
	for (i = 0; i < REAL_SIZE; i++) {
		vertices.push(Math.random() * 2000 - 1000);
		vertices.push(Math.random() * 2000 - 1000);
		vertices.push(Math.random() * 2000 - 1000);
	}
	const vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	const posAttr = new three.GLBufferAttribute(vbo, gl.FLOAT, 3, 4, REAL_SIZE);
	geo.setAttribute('position', posAttr as unknown as three.BufferAttribute);
	geo.setDrawRange(0, REAL_SIZE);
	
	color = [1, 1, 0.5];
	size = 5;
	materials[0] = new three.PointsMaterial({ size });
	materials[0].color.setHSL(color[0], color[1], color[2]);
	particles = new three.Points(geo, materials[0]);
	scene.add(particles);
	
	return particles;
};


camera.position.z = 1000;
scene.fog = new three.FogExp2(0x000000, 0.0007);

cloud = addCloud();

screen.document.addEventListener('mousemove', onDocumentMouseMove);
screen.document.addEventListener('touchstart', onDocumentTouchStart);
screen.document.addEventListener('touchmove', onDocumentTouchMove);

screen.document.addEventListener('resize', onWindowResize);


loop(() => {
	const time = Date.now() * 0.00005;
	camera.position.x += (mouseX - camera.position.x) * 0.05;
	camera.position.y += (-mouseY - camera.position.y) * 0.05;
	camera.lookAt(scene.position);
	
	for (i = 0; i < materials.length; i++) {
		color = [1, 1, 0.5];
		h = (360 * (color[0] + time) % 360) / 360;
		materials[i].color.setHSL(h, color[1], color[2]);
	}
	
	if (cloud) {
		cloud.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
	}
	
	screen.renderer.render(scene, camera);
});
