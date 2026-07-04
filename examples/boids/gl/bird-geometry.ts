// oxlint-disable unicorn/prefer-math-trunc
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html

import * as THREE from 'three';

// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
export class BirdGeometry extends THREE.BufferGeometry {
	public constructor(population: number, group: number) {
		super();

		const trianglesPerBird = 3;
		const triangles = population * trianglesPerBird;
		const points = triangles * 3;

		const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
		const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
		const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
		const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);

		this.setAttribute('position', vertices);
		this.setAttribute('birdColor', birdColors);
		this.setAttribute('reference', references);
		this.setAttribute('birdVertex', birdVertex);

		// this.setAttribute('normal', new Float32Array(points * 3), 3);

		let v = 0;
		const verts_push = (...args: number[]) => {
			for (const arg of args) {
				vertices.array[v++] = arg;
			}
		};

		const wingsSpan = 20;

		for (let f = 0; f < population; f++) {
			// Body
			verts_push(0, -0, -20, 0, 4, -20, 0, 0, 30);

			// Wings
			verts_push(0, 0, -15, -wingsSpan, 0, 0, 0, 0, 15);
			verts_push(0, 0, 15, wingsSpan, 0, 0, 0, 0, -15);
		}

		for (let v = 0; v < points; v++) {
			const triangleIndex = ~~(v / 3);
			const birdIndex = ~~(triangleIndex / trianglesPerBird);
			const x = (birdIndex % group) / group;
			const y = ~~(birdIndex / group) / group;

			const c = new THREE.Color(0x666666 + (~~(v / 9) / population) * 0x666666);

			birdColors.array[v * 3 + 0] = c.r;
			birdColors.array[v * 3 + 1] = c.g;
			birdColors.array[v * 3 + 2] = c.b;

			references.array[v * 2] = x;
			references.array[v * 2 + 1] = y;

			birdVertex.array[v] = v % 9;
		}

		this.scale(0.2, 0.2, 0.2);
	}
}
