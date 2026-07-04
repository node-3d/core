import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as three from 'three';
import {
	Brush,
	Cloud,
	Drawable,
	gl,
	Lines,
	Points,
	Rect,
	Screen,
	Surface,
	Tris,
} from '../ts/index.ts';
import inited from './init.ts';

type TClassParams = Readonly<{
	screen: Screen;
}>;

// oxlint-disable-next-line typescript/no-explicit-any
type TClassDesc<C extends abstract new (...args: any[]) => object> = Readonly<{
	create: (params: TClassParams) => InstanceType<C>;
	props: readonly string[];
	methods: readonly string[];
}>;
type TStaticClasses = Readonly<{
	Brush: TClassDesc<typeof Brush>;
	Cloud: TClassDesc<typeof Cloud>;
	Drawable: TClassDesc<typeof Drawable>;
	Points: TClassDesc<typeof Points>;
	Lines: TClassDesc<typeof Lines>;
	Tris: TClassDesc<typeof Tris>;
	Rect: TClassDesc<typeof Rect>;
	Screen: TClassDesc<typeof Screen>;
	Surface: TClassDesc<typeof Surface>;
}>;

const staticClasses: TStaticClasses = {
	Brush: {
		create({ screen }) {
			return new Brush({ screen });
		},
		props: ['size', 'pos', 'visible', 'color'],
		methods: [],
	},
	Cloud: {
		create({ screen }) {
			const vertices = [];
			for (let i = 30; i > 0; i--) {
				vertices.push(Math.random() * 2000 - 1000);
			}
			const pos = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pos);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			return new Cloud({ screen, count: 10, attrs: { position: { vbo: pos, items: 3 } } });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'visible'],
		methods: [],
	},
	Drawable: {
		create({ screen }) {
			return new Drawable({ screen });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'z', 'visible', 'pos', 'color'],
		methods: [],
	},
	Points: {
		create({ screen }) {
			const vertices = [];
			for (let i = 30; i > 0; i--) {
				vertices.push(Math.random() * 2000 - 1000);
			}
			const pos = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pos);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			return new Points({ screen, count: 10, attrs: { position: { vbo: pos, items: 3 } } });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'visible'],
		methods: [],
	},
	Lines: {
		create({ screen }) {
			const vertices = [];
			for (let i = 30; i > 0; i--) {
				vertices.push(Math.random() * 2000 - 1000);
			}
			const pos = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pos);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			return new Lines({ screen, count: 10, attrs: { position: { vbo: pos, items: 3 } } });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'visible'],
		methods: [],
	},
	Tris: {
		create({ screen }) {
			const vertices = [];
			for (let i = 30; i > 0; i--) {
				vertices.push(Math.random() * 2000 - 1000);
			}
			const pos = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pos);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			return new Tris({ screen, count: 10, attrs: { position: { vbo: pos, items: 3 } } });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'visible'],
		methods: [],
	},
	Rect: {
		create({ screen }) {
			return new Rect({ screen });
		},
		props: ['three', 'screen', 'mat', 'geo', 'mesh', 'visible'],
		methods: [],
	},
	Screen: {
		create() {
			return new Screen({ three });
		},
		props: [
			'three',
			'canvas',
			'camera',
			'scene',
			'renderer',
			'context',
			'document',
			'width',
			'height',
			'w',
			'h',
			'size',
			'title',
			'fov',
		],
		methods: [],
	},
	Surface: {
		create({ screen }) {
			return new Surface({ screen });
		},
		props: [
			'canvas',
			'camera',
			'scene',
			'renderer',
			'context',
			'document',
			'title',
			'fov',
			'size',
			'texture',
		],
		methods: [],
	},
};

describe('Node.js 3D Core', () => {
	it('exports an object', () => {
		assert.strictEqual(typeof inited, 'object');
	});

	describe('Static classes', () => {
		const screen = new Screen({ three });

		for (const [k, current] of Object.entries(staticClasses)) {
			describe(k, () => {
				const instance = current.create({ screen }) as unknown as Record<string, unknown>;

				it('can be created', () => {
					assert.ok(instance);
				});

				for (const prop of current.props) {
					it(`#${prop} property exposed`, () => {
						assert.ok(instance[prop] !== undefined);
					});
				}

				for (const method of current.methods) {
					it(`#${method}() method exposed`, () => {
						assert.strictEqual(typeof instance[method], 'function');
					});
				}
			});
		}
	});
});
