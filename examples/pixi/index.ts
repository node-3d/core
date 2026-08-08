import { fileURLToPath } from 'node:url';
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
const maxFramesArg = process.argv.find((arg) => arg.startsWith('--max-frames='));
const maxFrames = maxFramesArg ? Number(maxFramesArg.split('=')[1]) : Infinity;

type TDomElementStub = {
	style: Record<string, string>;
	children: TDomElementStub[];
	parentNode: TDomElementStub | null;
	appendChild: (child: TDomElementStub) => TDomElementStub;
	remove: () => void;
	contains: (child: unknown) => boolean;
};

const createDomElementStub = (): TDomElementStub => {
	const element: TDomElementStub = {
		style: {},
		children: [],
		parentNode: null,
		appendChild(child) {
			child.parentNode = element;
			element.children.push(child);
			return child;
		},
		remove() {
			if (!element.parentNode) {
				return;
			}
			element.parentNode.children = element.parentNode.children.filter(
				(child) => child !== element,
			);
			element.parentNode = null;
		},
		contains(child) {
			return element.children.includes(child as TDomElementStub);
		},
	};
	return element;
};

const createOld = doc.createElement.bind(doc);
doc.createElement = (name) => {
	if (name === 'div' || name === 'a' || name === 'button') {
		return createDomElementStub() as unknown as ReturnType<typeof createOld>;
	}
	return createOld(name);
};

// based on https://pixijs.io/examples/#/demos-basic/container.js

const app = new PIXI.Application();
await app.init({
	backgroundColor: 0x1099bb,
	resolution: window.devicePixelRatio || 1,
	canvas: canvas as unknown as HTMLCanvasElement,
	preference: 'webgl',
});

const container = new PIXI.Container();

app.stage.addChild(container);

// Create a new texture.
await PIXI.Assets.init({
	skipDetections: true,
	texturePreference: {
		format: ['png'],
	},
});
const texture = await PIXI.Assets.load(fileURLToPath(new URL('assets/bunny.png', import.meta.url)));

// Create a 5x5 grid of bunnies.
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

// Center bunny sprite in local container coordinates.
container.pivot.x = container.width / 2;
container.pivot.y = container.height / 2;

let frames = 0;
app.ticker.add((ticker) => {
	container.rotation -= 0.01 * ticker.deltaTime;
	frames++;
	if (frames >= maxFrames) {
		app.ticker.stop();
		setImmediate(() => process.exit(0));
	}
});
