import type * as THREE from 'three';

const createColorQuads = (
	three: typeof THREE,
	scenePost: THREE.Scene,
	palette: readonly THREE.Color[],
	isSwap: boolean,
): THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] => {
	const colorQuads: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
	
	for (let i = 0; i < palette.length; i++) {
		const color = palette[i];
		const materialColor = new three.ShaderMaterial({
			side: three.CullFaceFront,
			depthTest: false,
			depthWrite: false,
			transparent: false,
			lights: false,
			uniforms: {
				color: { value: color },
			},
			vertexShader: `
				void main() {
					gl_Position = vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform vec3 color;
				void main() {
					gl_FragColor = vec4(color, 1.0);
				}
			`,
		});
		const quadColor = new three.Mesh(
			new three.PlaneGeometry(0.1, 2 / palette.length), materialColor,
		);
		quadColor.geometry.translate(-0.95, -1 + 2 * (i + 0.5) / palette.length, 1);
		quadColor.visible = isSwap;
		scenePost.add(quadColor);
		colorQuads.push(quadColor);
	}
	
	return colorQuads;
};

export { createColorQuads };
export default { createColorQuads };
