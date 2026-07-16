# Node.js 3D Core

This is a part of [Node3D](https://github.com/node-3d) project.

[![NPM](https://badge.fury.io/js/@node-3d%2Fcore.svg)](https://badge.fury.io/js/@node-3d/core)
[![Lint](https://github.com/node-3d/core/actions/workflows/lint.yml/badge.svg)](https://github.com/node-3d/core/actions/workflows/lint.yml)
[![Test](https://github.com/node-3d/core/actions/workflows/test.yml/badge.svg)](https://github.com/node-3d/core/actions/workflows/test.yml)

```console
npm install @node-3d/core
```

> This package uses precompiled Node.js addons. **There is no compilation** during `npm install`.
The addons are compiled for: Windows x64, Linux x64, Linux ARM64, macOS ARM64.

![Example](examples/screenshot.png)

* WebGL/OpenGL on **Node.js** with support for web libs, such as **three.js**.
* Multi-window apps, low-level window control with [@node-3d/glfw](https://github.com/node-3d/glfw).
* Modern OpenGL functions also available, see [@node-3d/webgl](https://github.com/node-3d/webgl).
* Image loading/saving in popular formats with [@node-3d/image](https://github.com/node-3d/image).

## API

### `init(opts?: TInitOpts): TCore3D`

Initializes Node3D, creates the first `Document`, wires browser-like globals, and returns:

* `doc` - the created `Document`, also assigned to `globalThis.document` and `globalThis.window`.
* `loop` - shortcut for `doc.loop`.
* `raf` - shortcut for `doc.requestAnimationFrame`.

`init()` is cached. Repeated calls return the first result and do not create another document.

Options are mostly `@node-3d/glfw` `Document` options, plus:

* `isGles3` - request an OpenGL ES 3 style context and shader behavior, closest to WebGL.
* `isWebGL2` - expose the context as WebGL2 to browser-style libraries.
* `isVisible` - pass `false` to create an initially hidden window.

### `addThreeHelpers(three): void`

Patches a Three.js module instance for Node3D:

* Makes `three.FileLoader.load()` read files through Node.js.
* Adds `three.Texture.fromId(id)` so Three.js textures can wrap existing GL texture IDs.

Call this once before creating Three.js loaders/materials that depend on those behaviors.

### Re-exports

`@node-3d/core` re-exports the common pieces needed by apps:

* `Screen`, `Surface`, `Points`, `Lines`, `Tris`, `Rect`, `Brush`
* `Color`, `Vec2`, `Vec3`, `Vec4`
* `Document`, `Window`, `Image`
* `gl` from `@node-3d/webgl`
* `glfw` from `@node-3d/glfw`, with `glfw.Document` and `glfw.Window` attached

### `Screen`

`Screen` is the high-level Three.js helper. It creates or accepts a camera, scene, and renderer,
binds them to the Node3D document, forwards input events, and recreates the renderer when the
window mode changes.

Important members:

* `renderer`, `scene`, `camera`, `document`, `canvas`, `context`
* `width`, `height`, `w`, `h`, `size`
* `title`, `icon`, `fov`, `mode`
* `draw()` - renders `scene` with `camera`
* `snapshot(name?)` - saves the current framebuffer

### Drawable Helpers

The lightweight drawable classes are useful when you need simple geometry without writing
Three.js setup code each time:

* `Points` - point cloud drawable backed by GL buffers.
* `Lines` - line, segment, or loop drawable.
* `Tris` - triangle drawable.
* `Rect` - 2D rectangle helper.
* `Brush` - mouse/paint-style helper built on rectangles.
* `Surface` - nested render surface.

They are intentionally small wrappers around Three.js objects and raw GL resources.

## Example

(As in [crate-lean.ts](examples/crate-lean.ts)):

```javascript
import * as THREE from 'three';

import { Screen, addThreeHelpers, init } from '@node-3d/core';

const { loop } = init({
	isGles3: true, vsync: true, autoEsc: true, autoFullscreen: true, title: 'Crate',
});
addThreeHelpers(THREE);
const screen = new Screen({ three: THREE, fov: 70, z: 2 });

const texture = new THREE.TextureLoader().load('three/textures/crate.gif');
texture.colorSpace = THREE.SRGBColorSpace;
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
screen.scene.add(mesh);

loop((now) => {
	mesh.rotation.x = now * 0.0005;
	mesh.rotation.y = now * 0.001;
	screen.draw();
});
```

Example Notes:

1. You can run TypeScript examples directly with Node.js 24.
1. `loop` is a convenience method, you can use `requestAnimationFrame` too.
1. `autoFullscreen` option enables "CTRL+F", "CTRL+SHIFT+F", "CTRL+ALT+F" to switch
	window modes.
1. `Screen` helps with **three.js**-oriented resource management, but is not required.
1. **three.js** uses VAO, so if not using `Screen`, handling the window mode changes
	(which creates a separate OpenGL context) is up to you.
	Basically, `doc.on('mode', () => {...})` -
	here you should re-create `THREE.WebGLRenderer`. See the current
	[Screen implementation](ts/objects/screen.ts).


## OpenGL Features

1. This is real **native OpenGL**, and you have direct access to GL resource IDs. This may be
	useful for resource sharing and compute interop:
	* [CUDA-GL interop](https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__OPENGL.html).
	* [OpenCL-GL interop](https://registry.khronos.org/OpenCL/sdk/3.0/docs/man/html/clEnqueueAcquireGLObjects.html) - see [example](examples/boids).
	* [Context sharing](https://www.glfw.org/docs/latest/context_guide.html#context_sharing).
1. The flag `isGles3` lets you use a **GL ES 3** preset, which is closest to "real" WebGL.
	If set to `false`, WebGL stuff (such as three.js) will still work, but now with some hacks.
	However, if you are planning to use non-WebGL features (e.g. **OpenGL 4.5** features),
	you might want it off, and then select a specific context version manually.
1. The flag `isWebGL2` impacts how web libraries recognize the WebGL version.
	But it doesn't really change the capabilities of the engine.
1. **Offscreen rendering** is possible on Windows and Linux, as demonstrated by the tests
	running in GitHub Actions. There are test cases that generate and compare screenshots.
1. OpenGL **context sharing** is enabled. You can obtain `HDC, HWND, CTX` for Windows and whatever
	those are called on Linux and macOS. See [@node-3d/glfw](https://github.com/node-3d/glfw).


## License

**You get this for free. Have fun!**

Some of the components have their separate licenses, but all of them may be used
commercially, without royalty.
