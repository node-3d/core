import * as PIXI from 'pixi.js';
import { init } from '@node-3d/core';

const { doc } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	vsync: true,
	title: 'PIXI',
});
const canvas = doc;
const window = doc;

const createOld = doc.createElement.bind(doc);
doc.createElement = (name) => {
	if (name === 'div' || name === 'a') {
		return { style: {} } as ReturnType<typeof createOld>;
	}
	return createOld(name);
};

// based on https://pixijs.io/examples/#/demos-basic/container.js

const app = new PIXI.Application({
	backgroundColor: 0x1099bb,
	resolution: window.devicePixelRatio || 1,
	view: canvas as unknown as HTMLCanvasElement,
});

const container = new PIXI.Container();

app.stage.addChild(container);

// Create a new texture
const texture = PIXI.Texture.from('https://pixijs.io/examples/examples/assets/bunny.png');

// Create a 5x5 grid of bunnies
for (let i = 0; i < 25; i++) {
	const bunny = new PIXI.Sprite(texture);
	bunny.anchor.set(0.5);
	bunny.x = (i % 5) * 40;
	bunny.y = Math.floor(i / 5) * 40;
	container.addChild(bunny);
}

// Move container to the center
container.x = app.screen.width / 2;
container.y = app.screen.height / 2;

// Center bunny sprite in local container coordinates
container.pivot.x = container.width / 2;
container.pivot.y = container.height / 2;

app.ticker.add((delta: number) => {
	container.rotation -= 0.01 * delta;
});
