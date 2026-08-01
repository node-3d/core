import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TWebgl } from '../types.ts';

export type TScreenshotContext = Pick<TWebgl, 'RGBA' | 'UNSIGNED_BYTE' | 'readPixels'>;

export type TScreenshotImage = {
	data: Buffer | null;
	width: number;
	height: number;
	save: (name: string) => boolean;
};

export type TScreenshotImageConstructor = {
	fromPixels: (width: number, height: number, bpp: number, data: Buffer) => TScreenshotImage;
	loadAsync: (name: string) => Promise<TScreenshotImage>;
};

export type TScreenshotTarget = Readonly<{
	width: number;
	height: number;
	context: TScreenshotContext;
	Image: TScreenshotImageConstructor;
}>;

export type TScreenshotPaths = Readonly<{
	diffDir: string;
	screenshotsDir: string;
}>;

export type TScreenshotReportLevel = 'error' | 'info' | 'warn';

export type TScreenshotReporter = (
	level: TScreenshotReportLevel,
	message: string,
	error?: unknown,
) => void;

export type TScreenshotOptions = Partial<
	Readonly<{
		pixelThreshold: number;
		maxFailedPixels: number;
		paths: Partial<TScreenshotPaths>;
		report: TScreenshotReporter;
	}>
>;

const defaultOptions = {
	pixelThreshold: 0.2,
	maxFailedPixels: 100,
	paths: {
		diffDir: 'test/__diff__',
		screenshotsDir: '__screenshots__',
	},
	report: null as TScreenshotReporter | null,
} as const;

const normalizeOptions = (opts: TScreenshotOptions = {}) => ({
	...defaultOptions,
	...opts,
	paths: {
		...defaultOptions.paths,
		...opts.paths,
	},
});

const ensureParentDir = async (path: string): Promise<void> => {
	await fs.mkdir(dirname(path), { recursive: true });
};

const pathExists = async (path: string): Promise<boolean> => {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
};

const makePathDiff = (name: string, paths: TScreenshotPaths): string =>
	`${paths.diffDir}/${name}.png`;

const makePathExpected = (name: string, paths: TScreenshotPaths): string =>
	`${paths.diffDir}/${name}__expected__.png`;

const makePathActual = (name: string, paths: TScreenshotPaths): string =>
	`${paths.diffDir}/${name}__actual__.png`;

const makePathExport = (name: string, paths: TScreenshotPaths): string =>
	`${paths.screenshotsDir}/${name}.png`;

const allocBuffer = (target: TScreenshotTarget): Buffer => {
	const memSize = target.width * target.height * 4;
	return Buffer.allocUnsafeSlow(memSize);
};

const getImage = (target: TScreenshotTarget): TScreenshotImage | null => {
	try {
		const storage = { data: allocBuffer(target) };

		target.context.readPixels(
			0,
			0,
			target.width,
			target.height,
			target.context.RGBA,
			target.context.UNSIGNED_BYTE,
			storage,
		);

		return target.Image.fromPixels(target.width, target.height, 32, storage.data);
	} catch {
		return null;
	}
};

const loadPixelmatch = async () => {
	try {
		const { default: pixelmatch } = await import('pixelmatch');
		return pixelmatch;
	} catch (error) {
		throw new Error(
			'Unable to compare screenshots. Install "pixelmatch" as a dev dependency to use @node-3d/core/testing.',
			{ cause: error },
		);
	}
};

export const makeScreenshot = async (
	name: string,
	target: TScreenshotTarget,
	opts: TScreenshotOptions = {},
): Promise<boolean> => {
	const { paths, report } = normalizeOptions(opts);
	const path = makePathExport(name, paths);
	const img = getImage(target);

	if (!img) {
		return false;
	}

	await ensureParentDir(path);
	img.save(path);
	report?.('info', `Screenshot: ${name} generated`);
	return true;
};

export const compareScreenshot = async (
	name: string,
	target: TScreenshotTarget,
	opts: TScreenshotOptions = {},
): Promise<boolean> => {
	const { maxFailedPixels, paths, pixelThreshold, report } = normalizeOptions(opts);
	const path = makePathExport(name, paths);

	if (!(await pathExists(path))) {
		report?.('error', `Warning! No such screenshot: ${name}.`);
		return false;
	}

	const actualImage = getImage(target);
	if (!actualImage?.data) {
		return false;
	}

	const expectedImage = await target.Image.loadAsync(path);
	if (!expectedImage.data) {
		return false;
	}

	const diff = allocBuffer(target);
	const pixelmatch = await loadPixelmatch();
	const numFailedPixels = pixelmatch(
		expectedImage.data,
		actualImage.data,
		diff,
		actualImage.width,
		actualImage.height,
		{
			threshold: pixelThreshold,
			alpha: 0.3,
			diffMask: false,
			diffColor: [255, 0, 0],
		},
	);

	if (!numFailedPixels) {
		return true;
	}

	report?.('warn', `Screenshot: ${name} - ${numFailedPixels}/${maxFailedPixels}.`);

	const pathDiff = makePathDiff(name, paths);
	const pathExpected = makePathExpected(name, paths);
	const pathActual = makePathActual(name, paths);

	await ensureParentDir(pathDiff);
	actualImage.save(pathActual);
	expectedImage.save(pathExpected);

	const diffImage = target.Image.fromPixels(target.width, target.height, 32, diff);
	diffImage.save(pathDiff);

	const isError = numFailedPixels >= maxFailedPixels;
	report?.(
		isError ? 'error' : 'warn',
		[
			`Screenshot: ${name}.`,
			`Failed pixels: ${numFailedPixels}/${maxFailedPixels}.`,
			`Diff written: ${pathDiff}.`,
		].join('\n'),
	);

	return !isError;
};

export const matchScreenshot = async (
	name: string,
	target: TScreenshotTarget,
	opts: TScreenshotOptions = {},
): Promise<boolean> => {
	try {
		const { paths } = normalizeOptions(opts);
		const path = makePathExport(name, paths);

		// oxlint-disable-next-line node/no-process-env
		const isCi = !!process.env['CI'];
		const hasFile = await pathExists(path);

		if (!hasFile && !isCi) {
			return await makeScreenshot(name, target, opts);
		}

		return compareScreenshot(name, target, opts);
	} catch (error) {
		normalizeOptions(opts).report?.('error', 'Unable to match screenshot.', error);
		return false;
	}
};
