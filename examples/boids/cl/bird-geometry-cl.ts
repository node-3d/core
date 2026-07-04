import * as THREE from 'three';
import * as node3d from '@node-3d/core';

export type TVboInfo = {
	vbo: WebGLBuffer;
	array: Float32Array;
	attribute: THREE.BufferAttribute;
};

export type TBirdVbos = {
	velocity: TVboInfo;
	offsets: TVboInfo;
};

const createVbo = (count: number, elements: number): TVboInfo => {
	const { gl } = node3d;
	const array = new Float32Array(count * elements);
	const vbo = gl.createBuffer();
	const attribute = new THREE.GLBufferAttribute(
		vbo as unknown as globalThis.WebGLBuffer,
		gl.FLOAT,
		elements,
		4,
		count,
	);

	// HACK: instancing support
	const iattr = attribute as unknown as THREE.InstancedBufferAttribute;
	(iattr as { isInstancedBufferAttribute: boolean }).isInstancedBufferAttribute = true;
	iattr.meshPerAttribute = 1;

	return {
		vbo,
		array,
		attribute: iattr,
	};
};

// Custom Geometry - 3 triangles and instancing data.
export class BirdGeometryCl extends THREE.InstancedBufferGeometry {
	public vbos: TBirdVbos;

	public constructor(population: number) {
		super();

		this.instanceCount = population;

		const wingsSpan = 20;
		const vertData = [
			// Body
			0,
			-0,
			-wingsSpan,
			0,
			4,
			-wingsSpan,
			0,
			0,
			30,

			// Wings
			0,
			0,
			-15,
			-wingsSpan,
			0,
			0,
			0,
			0,
			15,
			0,
			0,
			15,
			wingsSpan,
			0,
			0,
			0,
			0,
			-15,
		].map((x) => x * 0.2);
		const idxData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

		const vertices = new THREE.BufferAttribute(new Float32Array(vertData), 3);
		const vertidx = new THREE.BufferAttribute(new Uint32Array(idxData), 1);

		const velocity = createVbo(population, 4);
		const offsets = createVbo(population, 4);

		this.vbos = { velocity, offsets };

		// Non-instanced part, one bird
		this.setAttribute('position', vertices);
		this.setAttribute('vertidx', vertidx);

		// Per-instance items
		this.setAttribute('velocity', velocity.attribute);
		this.setAttribute('offset', offsets.attribute);

		this.computeBoundingSphere = () => {
			this.boundingSphere = new THREE.Sphere(undefined, Infinity);
		};
		this.computeBoundingSphere();
	}
}
