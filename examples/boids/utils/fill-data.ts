export const randBound = (extents: number = 1): [number, number, number] => {
	const half = extents * 0.5;
	return [
		Math.random() * extents - half,
		Math.random() * extents - half,
		Math.random() * extents - half,
	];
};

export const fillPositionAndPhase = (data: ArrayBufferView, extents: number): void => {
	const asF32 = new Float32Array(data.buffer);
	const len = asF32.length;
	
	for (let i = 0; i < len; i += 4) {
		const [x, y, z] = randBound(extents);
		asF32[i + 0] = x;
		asF32[i + 1] = y;
		asF32[i + 2] = z;
		asF32[i + 3] = 1;
	}
};

export const fillVelocity = (data: ArrayBufferView): void => {
	const asF32 = new Float32Array(data.buffer);
	const len = asF32.length;
	
	for (let i = 0; i < len; i += 4) {
		const [x, y, z] = randBound(1);
		asF32[i + 0] = x * 10;
		asF32[i + 1] = y * 10;
		asF32[i + 2] = z * 10;
		asF32[i + 3] = 1;
	}
};

export const fillColorBuffer = (array: Float32Array): void => {
	const len = array.length;
	
	for (let i = 0; i < len; i += 3) {
		const c = 0.4 + 0.4 * (i / len);
		array[i + 0] = c;
		array[i + 1] = c;
		array[i + 2] = c;
		array[i + 3] = 1;
	}
};
