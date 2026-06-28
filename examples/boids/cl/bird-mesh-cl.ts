import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { BirdGeometryCl } from './bird-geometry-cl.ts';
import type { TBirdVbos } from './bird-geometry-cl.ts';

const birdVS: string = readFileSync('cl/bird-vs.glsl').toString();
const birdFS: string = readFileSync('cl/bird-fs.glsl').toString();

export type TBirdUniforms = {
	color: THREE.Uniform,
};

// Custom Mesh - BirdGeometry and some point-cloud adjustments.
export class BirdMeshCl extends THREE.Mesh {
	public get vbos(): TBirdVbos { return (this.geometry as BirdGeometryCl).vbos; }
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
		
		const geometry = new BirdGeometryCl(population);
		
		super(geometry, material);
		
		this.uniforms = uniforms;
		
		this.rotation.y = Math.PI / 2;
		this.matrixAutoUpdate = false;
		this.updateMatrix();
	}
}
