import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import { Image } from '@node-3d/image';
import type { TWebgl } from '../types.ts';

export type TScreenshotContext = Pick<TWebgl, 'RGBA' | 'UNSIGNED_BYTE' | 'readPixels'>;

export type TScreenshotImage = {
	data: Buffer | null;
	width: number;
	height: number;
	save: (name: string) => boolean;
};

export type TScreenshotDocument = Readonly<{
	w: number;
	h: number;
	context: TScreenshotContext;
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
		diffDir: string;
		screenshotsDir: string;
		report: TScreenshotReporter;
	}>
>;

export type TScreenshotMatchOptions = TScreenshotOptions & Readonly<{ doc: TScreenshotDocument }>;

type TNormalizedScreenshotOptions = Readonly<{
	doc: TScreenshotDocument;
	pixelThreshold: number;
	maxFailedPixels: number;
	diffDir: string;
	screenshotsDir: string;
	report: TScreenshotReporter | null;
}>;

const defaultOptions = {
	pixelThreshold: 0.2,
	maxFailedPixels: 100,
	diffDir: 'test/__diff__',
	screenshotsDir: 'test/__screenshots__',
	report: null as TScreenshotReporter | null,
} as const;

const normalizeOptions = (opts: TScreenshotMatchOptions): TNormalizedScreenshotOptions => ({
	...defaultOptions,
	...opts,
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

const makePathDiff = (name: string, opts: Pick<TScreenshotMatchOptions, 'diffDir'>): string =>
	`${opts.diffDir}/${name}.png`;

const makePathExpected = (name: string, opts: Pick<TScreenshotMatchOptions, 'diffDir'>): string =>
	`${opts.diffDir}/${name}__expected__.png`;

const makePathActual = (name: string, opts: Pick<TScreenshotMatchOptions, 'diffDir'>): string =>
	`${opts.diffDir}/${name}__actual__.png`;

const makePathExport = (
	name: string,
	opts: Pick<TScreenshotMatchOptions, 'screenshotsDir'>,
): string => `${opts.screenshotsDir}/${name}.png`;

const allocBuffer = (doc: TScreenshotDocument): Buffer => {
	const memSize = doc.w * doc.h * 4;
	return Buffer.allocUnsafeSlow(memSize);
};

const getImage = (doc: TScreenshotDocument): TScreenshotImage | null => {
	try {
		const storage = { data: allocBuffer(doc) };

		doc.context.readPixels(
			0,
			0,
			doc.w,
			doc.h,
			doc.context.RGBA,
			doc.context.UNSIGNED_BYTE,
			storage,
		);

		return Image.fromPixels(doc.w, doc.h, 32, storage.data);
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
	opts: TScreenshotMatchOptions,
): Promise<boolean> => {
	const { doc, report, screenshotsDir } = normalizeOptions(opts);
	const path = makePathExport(name, { screenshotsDir });
	const img = getImage(doc);

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
	opts: TScreenshotMatchOptions,
): Promise<boolean> => {
	const { diffDir, doc, maxFailedPixels, pixelThreshold, report, screenshotsDir } =
		normalizeOptions(opts);
	const path = makePathExport(name, { screenshotsDir });

	if (!(await pathExists(path))) {
		report?.('error', `Warning! No such screenshot: ${name}.`);
		return false;
	}

	const actualImage = getImage(doc);
	if (!actualImage?.data) {
		return false;
	}

	const expectedImage = await Image.loadAsync(path);
	if (!expectedImage.data) {
		return false;
	}

	const diff = allocBuffer(doc);
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

	const pathDiff = makePathDiff(name, { diffDir });
	const pathExpected = makePathExpected(name, { diffDir });
	const pathActual = makePathActual(name, { diffDir });

	await ensureParentDir(pathDiff);
	actualImage.save(pathActual);
	expectedImage.save(pathExpected);

	const diffImage = Image.fromPixels(doc.w, doc.h, 32, diff);
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
	opts: TScreenshotMatchOptions,
): Promise<boolean> => {
	try {
		const { screenshotsDir } = normalizeOptions(opts);
		const path = makePathExport(name, { screenshotsDir });

		// oxlint-disable-next-line node/no-process-env
		const isCi = !!process.env['CI'];
		const hasFile = await pathExists(path);

		if (!hasFile && !isCi) {
			return await makeScreenshot(name, opts);
		}

		return compareScreenshot(name, opts);
	} catch (error) {
		normalizeOptions(opts).report?.('error', 'Unable to match screenshot.', error);
		return false;
	}
};
