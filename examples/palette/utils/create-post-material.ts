import type * as THREE from 'three';

const createPostMaterial = (
	three: typeof THREE,
	numColors: number,
	isSwap: boolean,
	modeGrayscale: number,
	palette: readonly THREE.Color[],
	fragmentShader: string,
): THREE.ShaderMaterial => new three.ShaderMaterial({
	side: three.CullFaceFront,
	uniforms: {
		isSwap: { value: isSwap },
		modeGrayscale: { value: modeGrayscale },
		t: { value: null },
		colors: { value: palette },
	},
	defines: {
		NUM_COLORS: numColors,
	},
	depthWrite: false,
	depthTest: false,
	transparent: false,
	lights: false,
	vertexShader: `
		out vec2 tc;
		void main() {
			tc = uv;
			gl_Position = vec4(position, 1.0);
		}
	`,
	fragmentShader,
	glslVersion: three.GLSL3,
});

export { createPostMaterial };
export default { createPostMaterial };
