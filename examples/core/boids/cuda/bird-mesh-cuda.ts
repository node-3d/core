import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { BirdGeometryCuda } from './bird-geometry-cuda.ts';
import type { TBirdVbos } from './bird-geometry-cuda.ts';

const birdVS: string = readFileSync(new URL('bird-vs.glsl', import.meta.url)).toString();
const birdFS: string = readFileSync(new URL('bird-fs.glsl', import.meta.url)).toString();

export type TBirdUniforms = {
	color: THREE.Uniform;
};

// Custom Mesh - BirdGeometryCuda and point-cloud adjustments.
export class BirdMeshCuda extends THREE.Mesh {
	public get vbos(): TBirdVbos {
		return (this.geometry as BirdGeometryCuda).vbos;
	}
	public uniforms: TBirdUniforms;

	public constructor(population: number) {
		const uniforms = {
			color: new THREE.Uniform(new THREE.Color(0)),
		} as const;

		const material = new THREE.ShaderMaterial({
			vertexShader: birdVS,
			fragmentShader: birdFS,
			side: THREE.DoubleSide,
			forceSinglePass: true,
			transparent: false,
			uniforms,
		});

		const geometry = new BirdGeometryCuda(population);

		super(geometry, material);

		this.uniforms = uniforms;

		this.rotation.y = Math.PI / 2;
		this.matrixAutoUpdate = false;
		this.updateMatrix();
	}
}
