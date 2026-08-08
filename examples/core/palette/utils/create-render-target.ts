import type * as THREE from 'three';

const createRenderTarget = (
	three: typeof THREE,
	materialPost: THREE.ShaderMaterial,
	w: number,
	h: number,
): THREE.WebGLRenderTarget => {
	const newRt = new three.WebGLRenderTarget(w, h, {
		minFilter: three.LinearFilter,
		magFilter: three.NearestFilter,
		format: three.RGBAFormat,
		colorSpace: three.LinearSRGBColorSpace,
	});

	materialPost.uniforms.t.value = newRt.texture;

	return newRt;
};

export { createRenderTarget };
export default { createRenderTarget };
