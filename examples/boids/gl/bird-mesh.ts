import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { BirdGeometry } from './bird-geometry.ts';

const birdVS: string = readFileSync('gl/bird-vs.glsl').toString();
const birdFS: string = readFileSync('gl/bird-fs.glsl').toString();

export type TBirdUniforms = {
	texturePosition: THREE.Uniform,
	textureVelocity: THREE.Uniform,
};

// Custom Mesh - BirdGeometry and some point-cloud adjustments.
export class BirdMesh extends THREE.Mesh {
	public uniforms: TBirdUniforms;
	
	public constructor(population: number, group: number) {
		const uniforms = {
			texturePosition: { value: null } as THREE.Uniform,
			textureVelocity: { value: null } as THREE.Uniform,
		} as const;
		
		const material = new THREE.ShaderMaterial({
			uniforms,
			vertexShader: birdVS,
			fragmentShader: birdFS,
			side: THREE.DoubleSide,
			forceSinglePass: true,
			transparent: false,
		});
		
		const geometry = new BirdGeometry(population, group);
		
		super(geometry, material);
		
		this.uniforms = uniforms;
		
		this.rotation.y = Math.PI / 2;
		this.matrixAutoUpdate = false;
		this.updateMatrix();
	}
}
