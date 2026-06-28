import { Blob } from 'node:buffer';
import fs from 'node:fs';
import type * as THREE from 'three';
import { download, getLogger } from '@node-3d/addon-tools';

const logger = getLogger('3d-core');

type TFileLoadValue = string | ArrayBuffer | Blob | Record<string, never> | unknown;
type TFileLoadCallback = (value: TFileLoadValue) => void;
type TFileErrorCallback = (error: unknown) => void;
type TFileLoaderThis = THREE.FileLoader & {
	mimeType?: string;
	responseType?: string;
	path?: string;
};
type TTextureProperties = {
	'__webglTexture'?: unknown;
	'__webglInit'?: boolean;
};
type TTextureConstructorWithFromId = typeof THREE.Texture & {
	fromId?: (id: number, renderer: THREE.WebGLRenderer) => THREE.Texture;
};

const finishLoad = (
	responseType: string | undefined,
	mimeType: string | undefined,
	onLoad: TFileLoadCallback | undefined,
	buffer: Buffer,
): void => {
	if (!onLoad) {
		return;
	}
	
	if (responseType === 'arraybuffer') {
		onLoad((new Uint8Array(buffer)).buffer);
		return;
	}
	
	if (responseType === 'blob') {
		onLoad(new Blob([buffer]));
		return;
	}
	
	if (responseType === 'document') {
		onLoad({});
		return;
	}
	
	if (responseType === 'json') {
		try {
			onLoad(JSON.parse(buffer.toString()) as unknown);
		} catch {
			onLoad({});
		}
		return;
	}
	
	if (!mimeType) {
		onLoad(buffer.toString());
		return;
	}
	
	const re = /charset="?([^;"\s]*)"?/iu;
	const exec = re.exec(mimeType);
	const label = exec && exec[1] ? exec[1].toLowerCase() : undefined;
	const decoder = new TextDecoder(label);
	
	onLoad(decoder.decode(buffer));
};

export type ThreeHelpersTargets = {
	FileLoader: unknown;
	Texture: unknown;
};

export const addThreeHelpers = (three: ThreeHelpersTargets): void => {
	const fileLoaderPrototype = (three.FileLoader as typeof THREE.FileLoader).prototype as unknown as {
		load: (
			url: string,
			onLoad?: TFileLoadCallback,
			onProgress?: (event: ProgressEvent) => void,
			onError?: TFileErrorCallback,
		) => THREE.FileLoader;
	};
	
	fileLoaderPrototype.load = function load(
		this: TFileLoaderThis,
		url: string,
		onLoad?: TFileLoadCallback,
		_onProgress?: (event: ProgressEvent) => void,
		onError?: TFileErrorCallback,
	): THREE.FileLoader {
		if (url.startsWith('data:')) {
			const [head, body] = url.split(',');
			const isBase64 = head.includes('base64');
			const data = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(unescape(body));
			finishLoad(this.responseType, this.mimeType, onLoad, data);
			return this;
		}
		
		if (/^https?:\/\//iu.test(url)) {
			(async () => {
				try {
					const data = await download(url);
					finishLoad(this.responseType, this.mimeType, onLoad, data);
				} catch (error) {
					if (typeof onError === 'function') {
						onError(error);
					} else {
						logger.error(error);
					}
				}
			})();
			
			return this;
		}
		
		const fsUrl = this.path === undefined ? url : this.path + url;
		fs.readFile(fsUrl, (error, data) => {
			if (error) {
				if (typeof onError === 'function') {
					onError(error);
				} else {
					logger.error(error);
				}
				return;
			}
			finishLoad(this.responseType, this.mimeType, onLoad, data);
		});
		
		return this;
	};
	
	const Texture = three.Texture as TTextureConstructorWithFromId;
	Texture.fromId = (id, renderer) => {
		const rawTexture = { _: id } as WebGLTexture;
		
		const texture = new (three.Texture as typeof THREE.Texture)();
		const properties = (renderer.properties?.get(texture) ?? texture) as TTextureProperties;
		properties['__webglTexture'] = rawTexture;
		properties['__webglInit'] = true;
		
		return texture;
	};
};
