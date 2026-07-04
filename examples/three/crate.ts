import * as three from 'three';

import { Screen, addThreeHelpers, init } from '@node-3d/core';

const { doc, raf: requestAnimationFrame } = init({
	isGles3: true,
	// isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Crate',
});
const window = doc;
const document = doc;
addThreeHelpers(three);

// --- classical theree js example below

const camera = new three.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 2;

const scene = new three.Scene();

const texture = new three.TextureLoader().load('textures/crate.gif');
texture.colorSpace = three.SRGBColorSpace;
const geometry = new three.BoxGeometry();
const material = new three.MeshBasicMaterial({ map: texture });
const mesh = new three.Mesh(geometry, material);
scene.add(mesh);

const renderer = new three.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const onWindowResize = (): undefined => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onWindowResize);

const screen = new Screen({ three });

const animate = () => {
	const time = Date.now();
	mesh.rotation.x = time * 0.0005;
	mesh.rotation.y = time * 0.001;
	screen.renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
