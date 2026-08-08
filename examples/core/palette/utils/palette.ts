// Derived from https://evannorton.github.io/acerolas-epic-color-palettes/

export type THueMode = 'monochromatic' | 'analagous' | 'complementary' | 'triadic' | 'tetradic';
export type TRgb = [r: number, g: number, b: number];

type TPaletteSettings = Readonly<{
	colorCount: number;
	fixed: number;
	hueBase: number;
	hueContrast: number;
	luminanceBase: number;
	luminanceContrast: number;
	saturationBase: number;
	saturationConstant: boolean;
	saturationContrast: number;
}>;

const oklabToLinearSrgb = (L: number, a: number, b: number): TRgb => {
	const l0 = L + 0.3963377774 * a + 0.2158037573 * b;
	const m0 = L - 0.1055613458 * a - 0.0638541728 * b;
	const s0 = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l0 * l0 * l0;
	const m = m0 * m0 * m0;
	const s = s0 * s0 * s0;

	return [
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
};

const oklchToOklab = (L: number, c: number, h: number): TRgb => [
	L,
	c * Math.cos(h),
	c * Math.sin(h),
];

const lerp = (min: number, max: number, t: number): number => min + (max - min) * t;

const generateOKLCH = (hueMode: THueMode, settings: TPaletteSettings): TRgb[] => {
	const oklchColors: TRgb[] = [];

	const hueBase = settings.hueBase * 2 * Math.PI;
	const hueContrast = lerp(0.33, 1.0, settings.hueContrast);

	const chromaBase = lerp(0.01, 0.1, settings.saturationBase);
	const chromaContrast = lerp(0.075, 0.125 - chromaBase, settings.saturationContrast);
	const chromaFixed = lerp(0.01, 0.125, settings.fixed);

	const lightnessBase = lerp(0.3, 0.6, settings.luminanceBase);
	const lightnessContrast = lerp(0.3, 1.0 - lightnessBase, settings.luminanceContrast);
	const lightnessFixed = lerp(0.6, 0.9, settings.fixed);

	let chromaConstant = settings.saturationConstant;
	let lightnessConstant = !chromaConstant;

	if (hueMode === 'monochromatic') {
		chromaConstant = false;
		lightnessConstant = false;
	}

	for (let i = 0; i < settings.colorCount; ++i) {
		const linearIterator = i / (settings.colorCount - 1);

		let hueOffset = linearIterator * hueContrast * 2 * Math.PI + Math.PI / 4;

		if (hueMode === 'monochromatic') {
			hueOffset *= 0.0;
		}
		if (hueMode === 'analagous') {
			hueOffset *= 0.25;
		}
		if (hueMode === 'complementary') {
			hueOffset *= 0.33;
		}
		if (hueMode === 'triadic') {
			hueOffset *= 0.66;
		}
		if (hueMode === 'tetradic') {
			hueOffset *= 0.75;
		}

		if (hueMode !== 'monochromatic') {
			hueOffset += (Math.random() * 2 - 1) * 0.01;
		}

		let chroma = chromaBase + linearIterator * chromaContrast;
		let lightness = lightnessBase + linearIterator * lightnessContrast;

		if (chromaConstant) {
			chroma = chromaFixed;
		}
		if (lightnessConstant) {
			lightness = lightnessFixed;
		}

		const lab = oklchToOklab(lightness, chroma, hueBase + hueOffset);
		const rgb = oklabToLinearSrgb(lab[0], lab[1], lab[2]);

		rgb[0] = Math.max(0.0, Math.min(rgb[0], 1.0));
		rgb[1] = Math.max(0.0, Math.min(rgb[1], 1.0));
		rgb[2] = Math.max(0.0, Math.min(rgb[2], 1.0));

		oklchColors.push(rgb);
	}

	return oklchColors;
};

const createSettings = (colorCount: number): TPaletteSettings => ({
	hueBase: Math.random(),
	hueContrast: Math.random(),
	saturationBase: Math.random(),
	saturationContrast: Math.random(),
	luminanceBase: Math.random(),
	luminanceContrast: Math.random(),
	fixed: Math.random(),
	saturationConstant: true,
	colorCount,
});

const generatePalette = (hueMode: THueMode, colorCount: number): TRgb[] => {
	const paletteSettings = createSettings(colorCount);
	const lch = generateOKLCH(hueMode, paletteSettings);
	console.log('New palette:', hueMode, lch);
	return lch;
};

const hueOffsets = {
	monochromatic: 0.0,
	analagous: 0.25,
	complementary: 0.33,
	triadic: 0.66,
	tetradic: 0.75,
} as const satisfies Record<THueMode, number>;

const hueModes = Object.keys(hueOffsets) as THueMode[];

export { hueModes, generatePalette };
export default {
	hueModes,
	generatePalette,
};
