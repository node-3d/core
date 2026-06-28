import { Vec3 } from './vec3.ts';
import { Vec4 } from './vec4.ts';
import type { TColorSource, TVec3Source, TVec4Source } from '../types.ts';

type TRgba = Readonly<{
	r: number;
	g: number;
	b: number;
	a: number;
}>;

type TRgbaObject = Readonly<{
	r: number;
	g: number;
	b: number;
	a?: number;
}>;

const hasRgb = (value: object): value is TRgbaObject => (
	'r' in value && 'g' in value && 'b' in value &&
	typeof value.r === 'number' &&
	typeof value.g === 'number' &&
	typeof value.b === 'number'
);

/**
 * Four-component color.
 */
export class Color extends Vec4 {
	public constructor(source?: TColorSource, g?: number, b?: number, a?: number) {
		const { r, g: green, b: blue, a: alpha } = Color.rgbaFrom(source, g, b, a);
		super(r, green, blue, alpha);
	}
	
	public static clampTo1(value: number): number {
		return value > 1 ? value / 255 : value;
	}
	
	public static rgbaFrom(source?: TColorSource, g?: number, b?: number, a?: number): TRgba {
		if (source === undefined) {
			return Color.rgbaFromEmpty();
		}
		
		if (typeof source === 'object') {
			return Color.rgbaFromObject(source, g);
		}
		
		if (typeof source === 'number' && source < 256) {
			return Color.rgbaFromFloats(source, g, b, a);
		}
		
		return Color.rgbaFromString(source);
	}
	
	public static rgbaFromEmpty(): TRgba {
		return { r: 0, g: 0, b: 0, a: 1 };
	}
	
	public static rgbaFromObject(source: Exclude<TColorSource, string | number>, alpha?: number): TRgba {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 1;
		
		if (source === null) {
			return { r, g, b, a };
		}
		
		if (Array.isArray(source) || source instanceof Color) {
			r = source[0];
			g = source[1];
			b = source[2];
			a = typeof source[3] === 'number' ? source[3] : 1;
		} else if (hasRgb(source)) {
			r = source.r;
			g = source.g;
			b = source.b;
			a = typeof source.a === 'number' ? source.a : 1;
		} else if (source instanceof Vec3) {
			r = source.x;
			g = source.y;
			b = source.z;
			a = typeof alpha === 'number' ? alpha : 1;
		}
		
		return {
			r: Color.clampTo1(r),
			g: Color.clampTo1(g),
			b: Color.clampTo1(b),
			a: Color.clampTo1(a),
		};
	}
	
	public static rgbaFromFloats(rRaw: number, gRaw?: number, bRaw?: number, aRaw?: number): TRgba {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 1;
		
		if (Number.isNaN(rRaw)) {
			return { r, g, b, a };
		}
		
		r = rRaw;
		g = typeof gRaw === 'number' && typeof bRaw === 'number' ? gRaw : rRaw;
		b = typeof bRaw === 'number' ? bRaw : rRaw;
		
		if (typeof aRaw === 'number') {
			a = aRaw;
		} else if (typeof bRaw === 'number') {
			a = 1;
		} else if (typeof gRaw === 'number') {
			a = gRaw;
		}
		
		return {
			r: Color.clampTo1(r),
			g: Color.clampTo1(g),
			b: Color.clampTo1(b),
			a: Color.clampTo1(a),
		};
	}
	
	public static rgbaFromString(source: string | number): TRgba {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 1;
		
		let rest = typeof source === 'string' ? Number.parseInt(source, 16) : source;
		
		if (Number.isNaN(rest)) {
			return { r, g, b, a };
		}
		
		if (rest > 256 * 256 * 256) {
			a = rest % 256;
			rest = Math.floor(rest / 256);
		}
		
		b = rest % 256;
		rest = Math.floor(rest / 256);
		
		g = rest % 256;
		rest = Math.floor(rest / 256);
		
		r = rest % 256;
		
		return {
			r: Color.clampTo1(r),
			g: Color.clampTo1(g),
			b: Color.clampTo1(b),
			a: Color.clampTo1(a),
		};
	}
	
	public get r(): number { return this.x; }
	public set r(value: number) { this.x = value; }
	
	public get g(): number { return this.y; }
	public set g(value: number) { this.y = value; }
	
	public get b(): number { return this.z; }
	public set b(value: number) { this.z = value; }
	
	public get a(): number { return this.w; }
	public set a(value: number) { this.w = value; }
	
	public get rgb(): Color { return new Color(this.r, this.g, this.b); }
	public set rgb(value: TVec3Source) { this.xyz = value; }
	
	public get rgba(): Color { return new Color(this.r, this.g, this.b, this.a); }
	public set rgba(value: TVec4Source) { this.xyzw = value; }
	
	public get opacity(): number { return this.a; }
	
	public get hex(): number {
		const scaled = this.scale(255).rounded;
		return scaled.b + 256 * scaled.g + 256 * 256 * scaled.r;
	}
	
	public toHex(): number {
		return this.hex;
	}
	
	public get hexA(): number {
		return Math.round(255 * this.a) + 256 * this.toHex();
	}
	
	public toHexA(): number {
		return this.hexA;
	}
	
	public override toString(): string {
		const r = Math.round(255 * this.r);
		return (r > 15 ? '' : '0') + this.hex.toString(16);
	}
	
	public toStringA(): string {
		const r = Math.round(255 * this.r);
		return (r > 15 ? '' : '0') + this.hexA.toString(16);
	}
}

export default Color;
