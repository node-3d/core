import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { screenshot } from './screenshot.ts';
import { window, document } from './init.ts';
import * as three from 'three';

const loadBox = () =>
	new Promise<three.Mesh>((res) => {
		const geometry = new three.BoxGeometry();
		const material = new three.MeshBasicMaterial();
		const mesh = new three.Mesh(geometry, material);
		const texture = new three.TextureLoader().load(
			path.resolve(import.meta.dirname, '../examples/three/textures/crate.gif'),
			() => res(mesh),
		);
		texture.colorSpace = three.SRGBColorSpace;
		material.map = texture;
		material.needsUpdate = true;
		mesh.rotation.x = Math.PI / 7;
		mesh.rotation.y = Math.PI / 5;
	});

describe('Screenshots', () => {
	it('matches box screenshot', async () => {
		const camera = new three.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			1,
			1000,
		);
		camera.position.z = 2;
		const scene = new three.Scene();

		const mesh = await loadBox();
		scene.add(mesh);

		const renderer = new three.WebGLRenderer();
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		renderer.render(scene, camera);

		assert.ok(await screenshot('box'));
	});
});
