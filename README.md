# Node.js 3D Core

This is a part of [Node3D](https://github.com/node-3d) project.

[![NPM](https://badge.fury.io/js/@node-3d%2Fcore.svg)](https://badge.fury.io/js/@node-3d%2Fcore)
[![Lint](https://github.com/node-3d/core/actions/workflows/lint.yml/badge.svg)](https://github.com/node-3d/core/actions/workflows/lint.yml)
[![Test](https://github.com/node-3d/core/actions/workflows/test.yml/badge.svg)](https://github.com/node-3d/core/actions/workflows/test.yml)

```bash
npm install @node-3d/core
```

> This package uses precompiled Node.js addons. **There is no compilation** during `npm install`.
The addons are compiled for: Windows x64, Linux x64/ARM64, macOS ARM64.

![Example](examples/screenshot.png)

* WebGL/OpenGL on **Node.js** with support for web libs, such as **three.js**.
* Multi-window apps, low-level window control with [@node-3d/glfw](https://github.com/node-3d/glfw).
* Modern OpenGL functions also available, see [@node-3d/webgl](https://github.com/node-3d/webgl).
* Image loading/saving in popular formats with [@node-3d/image](https://github.com/node-3d/image).

## API

### `init(opts?: TInitOpts): TCore3D`

Initializes Node3D, creates the first `BrowserDocument`, wires browser-like globals, and returns:

* `doc` - the created `BrowserDocument`, also assigned to `globalThis.document` and `globalThis.window`.
* `loop` - shortcut for `doc.loop`.
* `raf` - shortcut for `doc.requestAnimationFrame`.

`init()` is cached. Repeated calls return the first result and do not create another document.

Options are mostly `BrowserDocument` window options, plus:

* `isGles3` - request an OpenGL ES 3 style context and shader behavior, closest to WebGL.
* `isWebGL2` - expose the context as WebGL2 to browser-style libraries.
* `isVisible` - pass `false` to create an initially hidden window.

### `addThreeHelpers(three): void`

Patches a Three.js module instance for Node3D:

* Makes `three.FileLoader.load()` read files through Node.js.
* Adds `three.Texture.fromId(id)` so Three.js textures can wrap existing GL texture IDs.

Call this once before creating Three.js loaders/materials that depend on those behaviors.

### Core Exports

`@node-3d/core` implements the browser-like runtime and lightweight scene helpers:

* `BrowserDocument` / `Document` - browser-compatible document/window object backed by a GLFW window.
* `BrowserWindow` / `Window` - browser-style window API layered on top of native GLFW window behavior.
* `Screen` - high-level Three.js screen helper with renderer, scene, camera, events, and snapshots.
* `Surface` - nested render surface for rendering a scene into a texture.
* `Points` - point cloud drawable backed by GL buffers.
* `Lines` - line, segment, or loop drawable backed by GL buffers.
* `Tris` - triangle drawable backed by GL buffers.
* `Rect` - 2D rectangle drawable.
* `Brush` - mouse/paint-style rectangle helper.
* `Color` - RGBA color helper accepting CSS hex strings, integers, arrays, vectors, and color objects.
* `Vec2`, `Vec3`, `Vec4` - small vector helpers used by core drawables and geometry utilities.

### Package Re-exports

`@node-3d/core` also re-exports lower-level packages commonly needed by apps:

* `Image` from [@node-3d/image](https://github.com/node-3d/image).
* `gl` from [@node-3d/webgl](https://github.com/node-3d/webgl).
* `glfw` from [@node-3d/glfw](https://github.com/node-3d/glfw).

### Testing

`@node-3d/core/testing` exports optional screenshot helpers for visual tests. Install
`pixelmatch` in the testing package when using them:

```bash
npm install --save-dev pixelmatch
```

```typescript
import { matchScreenshot } from '@node-3d/core/testing';

assert.ok(await matchScreenshot('ui', {
	doc,
}));
```

By default, baselines are read from `test/__screenshots__` and diffs are written to `test/__diff__`.

### Class Screen

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

## Frame pacing and vsync

Node3D render callbacks are scheduled through the native GLFW/uv-loop path.
For ordinary rendering, use `vsync: true` and let Node3D pace frame starts
against the current monitor refresh rate.

`vsync` and `swapInterval` values follow this policy:

* `false` or `0` renders unpaced with `glfwSwapInterval(0)`.
* `true` uses the synced path.
* negative numbers request adaptive sync where available, otherwise normal sync.
* positive numbers request normal sync.

For synced paths, the native layer gates render callbacks in all window modes:
windowed, borderless, and fullscreen. Callbacks still receive actual monotonic
time, so input, animation, physics, and game logic stay connected to real time.
Applications that need to cap rare long pauses should clamp deltas or use a
fixed-step accumulator in their own simulation code.

## Examples

Examples are organized by source:

* `examples/core/` contains Node3D-authored examples, diagnostics, stress tests,
  and shared helpers.
* `examples/three/` contains examples copied or closely adapted from official
  Three.js examples.
* `examples/pixi/` contains examples copied or closely adapted from official
  Pixi examples.

Future vendor examples should use their own directory, such as
`examples/babylonjs/`, while Node3D-specific probes stay under `examples/core/`.

## Example

(As in [crate-lean.ts](examples/core/crate-lean.ts)):

```javascript
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

import { Screen, addThreeHelpers, init } from '@node-3d/core';

const { loop } = init({
	isGles3: true, vsync: true, autoEsc: true, autoFullscreen: true, title: 'Crate',
});
addThreeHelpers(THREE);
const screen = new Screen({ three: THREE, fov: 70, z: 2 });

const texture = new THREE.TextureLoader().load(
	fileURLToPath(new URL('../three/textures/crate.gif', import.meta.url)),
);
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
	* [OpenCL-GL interop](https://registry.khronos.org/OpenCL/sdk/3.0/docs/man/html/clEnqueueAcquireGLObjects.html) - see [example](examples/core/boids).
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
