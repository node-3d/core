import {
	DataTexture,
	LinearSRGBColorSpace,
	NoToneMapping,
	SRGBColorSpace,
	Uniform,
	WebGLRenderer,
} from 'three';

import { Image, init } from '@node-3d/core';
import { SimpleTextureProcessor } from './simple-texture-processor.ts';

init({
	isGles3: true,
	isWebGL2: true,
	isVisible: false,
});

const renderer = new WebGLRenderer({
	antialias: false,
	alpha: false,
	depth: false,
	powerPreference: 'high-performance',
	preserveDrawingBuffer: false,
});
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = LinearSRGBColorSpace;
renderer.toneMapping = NoToneMapping;

const processor = new SimpleTextureProcessor(512, renderer);

// A simple shader that passes through the texture
const shader = `
    uniform sampler2D tex;
    
    void main() {
      vec2 vUv = gl_FragCoord.xy / resolution.xy;
      gl_FragColor = texture2D(tex, vUv);
    }
`;

/** Create a datatexture of size 512x512 filled with constant value */
const createDataTexture = () => {
	const texture = new DataTexture();
	texture.image = {
		data: new Uint8ClampedArray(512 * 512 * 4)
			.fill(100, 0, 512 * 512 * 2)
			.fill(200, 512 * 512 * 2),
		width: 512,
		height: 512,
	};
	return texture;
};

const processAndSave = (savePath: string, texture: DataTexture) => {
	const res = processor.process(shader, {
		tex: new Uniform(texture),
	});
	console.log(res.slice(0, 4));

	const img = Image.fromPixels(512, 512, 32, Buffer.from(res));
	img.save(savePath);
};

console.log('LinearSRGBColorSpace');
const texture2 = createDataTexture();
texture2.colorSpace = LinearSRGBColorSpace;
texture2.needsUpdate = true;
processAndSave('screenshot-linear.png', texture2);

console.log('SRGBColorSpace');
const texture3 = createDataTexture();
texture3.colorSpace = SRGBColorSpace;
texture3.needsUpdate = true;
processAndSave('screenshot-srgb.png', texture3);
