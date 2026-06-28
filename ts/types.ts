import type * as THREE from 'three';
import type {
	Document as GlfwDocument,
	Window as GlfwWindow,
	TDocumentOpts,
	TEvent,
	TImageData,
	TSizeEvent,
	glfw as glfwNative,
} from '@node-3d/glfw';
import type { Image } from '@node-3d/image';
import type { TWebGL } from '@node-3d/webgl';

import type { WebVRManager } from './core/vr-manager.ts';
import type { Vec2 } from './math/vec2.ts';
import type { Vec3 } from './math/vec3.ts';
import type { Vec4 } from './math/vec4.ts';

export type TUnknownObject = Readonly<Record<string, unknown>>;
export type TThree = typeof THREE;
export type TWebgl = TWebGL;
export type TMutableWebgl = TWebgl & {
	canvas?: TDocument;
	shaderSource: TWebgl['shaderSource'];
};
export type TImageConstructor = typeof Image & {
	prototype: InstanceType<typeof Image> & {
		fillRect?: () => void;
	};
};
export type TGlfw = typeof glfwNative & {
	Document: typeof GlfwDocument;
	Window: typeof GlfwWindow;
};
export type TDocument = Omit<GlfwDocument, 'context' | 'getContext' | 'appendChild'> & {
	context: TWebgl;
	getContext: (kind: string) => TWebgl | InstanceType<TImageConstructor> | null;
	appendChild: (child?: unknown) => void;
	body: TDocument;
	location?: TLocation;
};

export type TLocation = Readonly<{
	href: string;
	ancestorOrigins: TUnknownObject;
	origin: string;
	protocol: string;
	host: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
}>;

export type TNavigator = Readonly<{
	appCodeName: string;
	appName: string;
	appVersion: string;
	bluetooth: TUnknownObject;
	clipboard: TUnknownObject;
	connection: {
		onchange: null;
		effectiveType: string;
		rtt: number;
		downlink: number;
		saveData: boolean;
	};
	cookieEnabled: boolean;
	credentials: TUnknownObject;
	deviceMemory: number;
	doNotTrack: null;
	geolocation: TUnknownObject;
	hardwareConcurrency: number;
	keyboard: TUnknownObject;
	language: string;
	languages: string[];
	locks: TUnknownObject;
	maxTouchPoints: number;
	mediaCapabilities: TUnknownObject;
	mediaDevices: { ondevicechange: null };
	mimeTypes: { length: number };
	onLine: boolean;
	permissions: TUnknownObject;
	platform: string;
	plugins: { length: number };
	presentation: { defaultRequest: null; receiver: null };
	product: string;
	productSub: string;
	serviceWorker: {
		ready: Promise<boolean>;
		controller: null;
		oncontrollerchange: null;
		onmessage: null;
	};
	storage: TUnknownObject;
	usb: {
		onconnect: null;
		ondisconnect: null;
	};
	userAgent: string;
	vendor: string;
	vendorSub: string;
	webkitPersistentStorage: TUnknownObject;
	webkitTemporaryStorage: TUnknownObject;
}>;

export type TWebVRManagerConstructor = typeof WebVRManager;

export type TVec2Source = Vec2 | readonly [number, number] | Readonly<{
	0: number;
	1: number;
	x?: number;
	y?: number;
}>;

export type TVec3Source = Vec3 | readonly [number, number, number] | Readonly<{
	0: number;
	1: number;
	2: number;
	x?: number;
	y?: number;
	z?: number;
}>;

export type TVec4Source = Vec4 | readonly [number, number, number, number] | Readonly<{
	0: number;
	1: number;
	2: number;
	3: number;
	x?: number;
	y?: number;
	z?: number;
	w?: number;
}>;

export type TColorSource = TVec3Source | TVec4Source | string | number | Readonly<{
	r: number;
	g: number;
	b: number;
	a?: number;
}>;

export type TCore3D = {
	doc: TDocument;
	loop: TDocument['loop'];
	raf: TDocument['requestAnimationFrame'];
};

export type TInitOpts = TDocumentOpts & Readonly<{
	isGles3?: boolean;
	isWebGL2?: boolean;
	isVisible?: boolean;
}>;

export type TNode3DGlobal = {
	globalThis?: TNode3DGlobal;
	THREE?: TThree;
	_gl?: TWebgl;
	Image?: TImageConstructor;
	WebVRManager?: TWebVRManagerConstructor;
	document?: TDocument;
	window?: TDocument;
	body?: TDocument;
	cwrap?: null;
	location?: TLocation;
	navigator?: TNavigator;
	addEventListener?: TDocument['addEventListener'];
	removeEventListener?: TDocument['removeEventListener'];
	requestAnimationFrame?: TDocument['requestAnimationFrame'];
	cancelAnimationFrame?: TDocument['cancelAnimationFrame'];
	self?: TNode3DGlobal;
};

export type TResizeEvent = TEvent & TSizeEvent;
export type TIcon = TImageData | null | undefined;
