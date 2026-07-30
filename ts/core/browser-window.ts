import { GlfwWindow } from '@node-3d/glfw';
import type { TAnimationFrameCallback, TWindowOpts } from '@node-3d/glfw';

/**
 * Browser-style window built on top of a native GLFW window.
 *
 * This layer owns requestAnimationFrame semantics. Direct native window drawing
 * stays in GlfwWindow through frame(), loop(), and drawWindow().
 */
export class BrowserWindow extends GlfwWindow {
	public constructor(opts: TWindowOpts = {}) {
		super(opts);

		this.requestAnimationFrame = (cb) => {
			const id = this._nextAnimationFrameId++;
			this._animationFrameCallbacks.set(id, cb);
			this._scheduleAnimationFrame();
			return id;
		};
		this.cancelAnimationFrame = (id) => {
			this._animationFrameCallbacks.delete(id);
			if (this._animationFrameCallbacks.size === 0 && this._animationFrameImmediate) {
				clearImmediate(this._animationFrameImmediate);
				this._animationFrameImmediate = null;
				this._nextAnimationFrameId = 1;
			}
		};
	}

	/** Bound `requestAnimationFrame` method, returns a timer id. */
	public requestAnimationFrame: (callback: TAnimationFrameCallback) => number;

	/** Bound `cancelAnimationFrame` method. Cancels by id. */
	public cancelAnimationFrame: (id: number) => void;

	private _scheduleAnimationFrame(): void {
		if (this._animationFrameImmediate) {
			return;
		}

		this._animationFrameImmediate = setImmediate(() => {
			this._animationFrameImmediate = null;
			this.drawWindow(this._runAnimationFrameCallbacks);
		});
	}

	private _runAnimationFrameCallbacks = (timestamp: number): void => {
		const callbacks = this._animationFrameCallbacks;
		this._animationFrameCallbacks = new Map();

		for (const listener of callbacks.values()) {
			listener(timestamp);
		}

		if (this._animationFrameCallbacks.size === 0) {
			this._nextAnimationFrameId = 1;
		}
	};

	// Queued browser-style animation frame callbacks.
	private _animationFrameCallbacks = new Map<number, TAnimationFrameCallback>();

	// Current scheduled animation frame runner.
	private _animationFrameImmediate: NodeJS.Immediate | null = null;

	// Monotonic id used by requestAnimationFrame/cancelAnimationFrame.
	private _nextAnimationFrameId: number = 1;
}
