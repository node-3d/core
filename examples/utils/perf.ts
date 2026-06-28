let prevTime = Date.now();
let frames = 0;

export const countFrame = (now: number): void => {
	frames++;
	if (now >= prevTime + 2000) {
		console.log(
			'FPS:', Math.floor((frames * 1000) / (now - prevTime)),
		);
		prevTime = now;
		frames = 0;
	}
};
