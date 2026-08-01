let prevTime = 0;
let frames = 0;

export const countFrame = (now: number): void => {
	frames++;
	// console.log('now', now, prevTime);
	if (now >= prevTime + 2000) {
		console.log('FPS:', Math.floor((frames * 1000) / (now - prevTime)));
		prevTime = now;
		frames = 0;
	}
};
