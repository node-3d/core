// Init Node3D environment
import * as THREE from 'three';
import { Screen, addThreeHelpers, init } from '@node-3d/core';

const { doc, loop } = init({
	isGles3: true,
	// isGles3: false, // - works too
	vsync: true,
	autoEsc: true,
	autoFullscreen: true,
	title: 'Knot',
});
addThreeHelpers(THREE);

// Three.js rendering setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, doc.w / doc.h, 0.2, 500);
camera.position.z = 35;
scene.background = new THREE.Color(0x333333);
const screen = new Screen({ THREE, camera, scene });

// Add scene lights
scene.add(new THREE.AmbientLight(0xc1c1c1, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-1, 0.5, 1);
scene.add(sun);

// Original knot mesh
const knotGeometry = new THREE.TorusKnotGeometry(10, 1.85, 256, 20, 2, 7);
const knotMaterial = new THREE.MeshToonMaterial({ color: 0x6cc24a });
const knotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
scene.add(knotMesh);

// A slightly larger knot mesh, inside-out black - for outline
const outlineGeometry = new THREE.TorusKnotGeometry(10, 2, 256, 20, 2, 7);
const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0, side: THREE.BackSide });
const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
knotMesh.add(outlineMesh);

// Called repeatedly to render new frames
loop((now) => {
	knotMesh.rotation.x = now * 0.0005;
	knotMesh.rotation.y = now * 0.001;
	screen.draw();
});
