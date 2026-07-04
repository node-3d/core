import { Camera, Mesh, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderTarget } from 'three';
import type { Uniform, WebGLRenderer } from 'three';

const createShaderMaterial = (
	computeFragmentShader: string,
	uniforms: Record<string, Uniform>,
	sizeX: number,
	sizeY: number,
) => {
	const material = new ShaderMaterial({
		uniforms: uniforms || {},
		vertexShader: `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }`,
		fragmentShader: computeFragmentShader,
	});

	material.defines['resolution'] = `vec2( ${sizeX.toFixed(1)}, ${sizeY.toFixed(1)} )`;

	return material;
};

export class SimpleTextureProcessor {
	public renderer: WebGLRenderer;
	public texture_size: number;
	public constructor(texture_size: number, renderer: WebGLRenderer) {
		this.renderer = renderer;
		this.texture_size = texture_size;
	}
	public process(shaderCode: string, uniforms: Record<string, Uniform>): Uint8Array {
		const [width, height] = [this.texture_size, this.texture_size];

		const scene = new Scene();
		const camera = new Camera();
		camera.position.z = 1;

		// Virtual plane
		const material = createShaderMaterial(shaderCode, uniforms, width, height);
		const mesh = new Mesh(new PlaneGeometry(2, 2), material);
		scene.add(mesh);

		// Render
		const renderTarget = new WebGLRenderTarget(width, height, {
			depthBuffer: false,
		});
		this.renderer.setRenderTarget(renderTarget);
		this.renderer.render(scene, camera);

		// Retrieve
		const pixels = new Uint8Array(width * height * 4); // 4 for RGBA
		this.renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels);

		return pixels;
	}
}
