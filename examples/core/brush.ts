import * as three from 'three';

import { Brush, Screen, init } from '@node-3d/core';

const { loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Brush',
});

const screen = new Screen({ three });
loop(() => screen.draw());

const brush = new Brush({ screen, color: 0x00ff00 });

screen.on('mousemove', (e) => {
	brush.pos = [e.x, e.y];
});
