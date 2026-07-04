import { Worker } from 'node:worker_threads';
import path from 'node:path';
import type * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

type TWorkerConstructorArg = ConstructorParameters<typeof Worker>[0];
type TWorkerOptions = ConstructorParameters<typeof Worker>[1];

const flipUv = (
	attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined,
): void => {
	if (!attribute) {
		return;
	}
	for (let i = 1; i < attribute.array.length; i += 2) {
		attribute.array[i] = 1 - attribute.array[i];
	}
};

const populateScene = (scene: THREE.Scene, cb: (mesh: THREE.Object3D) => void): void => {
	(globalThis as unknown as { Worker: typeof Worker }).Worker = class Worker2 extends Worker {
		public constructor(name: TWorkerConstructorArg, options?: TWorkerOptions) {
			const nameStr = name.toString();
			if (nameStr.startsWith('data:')) {
				const [, body] = nameStr.toString().split(',');
				super(unescape(body), { ...options, eval: true });
				return;
			}

			super(name, options);
		}
	} as unknown as typeof Worker;

	(async () => {
		const THREE = await import('three');
		const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
		const { DRACOLoader } = await import('./DRACOLoader.ts');

		const ambientLight = new THREE.AmbientLight(0xeeffee, 0.3);
		scene.add(ambientLight);

		const directionalLight1 = new THREE.DirectionalLight(0xeeeeff, 2.4);
		directionalLight1.position.set(20, 20, 20);
		scene.add(directionalLight1);

		const d = 10;
		directionalLight1.castShadow = true;
		directionalLight1.shadow.camera.left = -d;
		directionalLight1.shadow.camera.right = d;
		directionalLight1.shadow.camera.top = d;
		directionalLight1.shadow.camera.bottom = -d;
		directionalLight1.shadow.camera.near = 5;
		directionalLight1.shadow.camera.far = 60;
		directionalLight1.shadow.mapSize.x = 2048;
		directionalLight1.shadow.mapSize.y = 2048;
		directionalLight1.shadow.intensity = 0.55;

		const directionalLight2 = new THREE.DirectionalLight(0xffaaaa, 0.7);
		directionalLight2.position.set(-20, 5, 20).normalize();
		scene.add(directionalLight2);

		const directionalLight3 = new THREE.DirectionalLight(0xffddaa, 0.5);
		directionalLight3.position.set(5, -20, -5).normalize();
		scene.add(directionalLight3);

		scene.background = new THREE.Color(0x87ceeb);

		const dracoLoader = new DRACOLoader(undefined);
		dracoLoader.setDecoderPath(
			path.resolve(
				import.meta.dirname,
				'../../../node_modules/three/examples/jsm/libs/draco/gltf/',
			),
		);

		const loader = new GLTFLoader();
		loader.setDRACOLoader(
			dracoLoader as unknown as Parameters<typeof loader.setDRACOLoader>[0],
		);
		loader.load(
			path.resolve(import.meta.dirname, '../models/LittlestTokyo.glb'),
			(gltf: GLTF) => {
				gltf.scene.scale.set(0.01, 0.01, 0.01);

				gltf.scene.traverse((node) => {
					const mesh = node as THREE.Mesh;
					if (!mesh.isMesh) {
						return;
					}
					mesh.castShadow = true;
					flipUv(mesh.geometry.attributes.uv);
					flipUv(mesh.geometry.attributes.uv1);
				});

				scene.add(gltf.scene);
				cb(gltf.scene);
			},
		);

		const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xface8d });
		const geoFloor = new THREE.PlaneGeometry(100, 100, 4, 4);
		const meshFloor = new THREE.Mesh(geoFloor, floorMaterial);
		meshFloor.rotation.x = -Math.PI * 0.5;
		meshFloor.position.y = -2;
		meshFloor.receiveShadow = true;
		scene.add(meshFloor);
	})();
};

export { populateScene };
export default { populateScene };
