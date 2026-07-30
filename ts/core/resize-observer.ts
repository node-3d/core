import type { TRect } from '@node-3d/glfw';

type TResizeObserverTarget = Readonly<{
	width?: number;
	height?: number;
	clientWidth?: number;
	clientHeight?: number;
	getBoundingClientRect?: () => TRect;
}>;

type TResizeObserverEntry = Readonly<{
	target: unknown;
	contentRect: TRect;
}>;

type TResizeObserverCallback = (
	entries: readonly TResizeObserverEntry[],
	observer: ResizeObserver,
) => void;

const getTargetRect = (target: unknown): TRect => {
	const element = target as TResizeObserverTarget;
	const rect = element.getBoundingClientRect?.();
	if (rect) {
		return rect;
	}

	const width = element.clientWidth ?? element.width ?? 0;
	const height = element.clientHeight ?? element.height ?? 0;

	return {
		x: 0,
		y: 0,
		width,
		height,
		left: 0,
		top: 0,
		right: width,
		bottom: height,
	};
};

/**
 * Minimal ResizeObserver implementation for browser-oriented renderers.
 *
 * Node3D has no layout engine, so `observe()` reports the current element rect
 * once. Libraries that need continuous layout tracking should listen to window
 * resize events directly.
 */
export class ResizeObserver {
	private readonly _callback: TResizeObserverCallback;
	private readonly _observed = new Set<unknown>();
	private _pending: NodeJS.Immediate | null = null;

	public constructor(callback: TResizeObserverCallback) {
		this._callback = callback;
	}

	public observe(target: unknown): void {
		this._observed.add(target);
		this._schedule();
	}

	public unobserve(target: unknown): void {
		this._observed.delete(target);
	}

	public disconnect(): void {
		this._observed.clear();
		if (this._pending) {
			clearImmediate(this._pending);
			this._pending = null;
		}
	}

	private _schedule(): void {
		if (this._pending) {
			return;
		}

		this._pending = setImmediate(() => {
			this._pending = null;
			const entries = [...this._observed].map((target) => ({
				target,
				contentRect: getTargetRect(target),
			}));
			if (entries.length > 0) {
				this._callback(entries, this);
			}
		});
	}
}
