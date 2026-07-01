import * as three from 'three';

import { Image, Screen, init } from '@node-3d/core';


const { loop } = init({
	isGles3: true,
	isWebGL2: true,
	autoEsc: true,
	autoFullscreen: true,
	vsync: true,
	title: 'Mesh',
});

const screen = new Screen({ three });

const icon = new Image();
icon.src = 'crate.jpg';
icon.on('load', () => {
	if (icon.data) {
		screen.icon = { width: icon.width, height: icon.height, data: icon.data };
	}
});

const geometry = new three.IcosahedronGeometry(2, 1);
const material =  new three.MeshLambertMaterial({
	color: 0x888888 + Math.round((0xFFFFFF - 0x888888) * Math.random()),
	emissive: 0x333333,
});

const mesh = new three.Mesh(geometry, material);
screen.scene.add( mesh );

const pointLight = new three.PointLight(0xFFFFFF, 1, 100);
screen.scene.add(pointLight);
pointLight.position.x = 2;
pointLight.position.y = 20;
pointLight.position.z = 5;


loop((now) => {
	mesh.rotation.x = now * 0.0005;
	mesh.rotation.y = now * 0.001;
	mesh.rotation.z = now * 0.0007;
	screen.draw();
});
