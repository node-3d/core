import type * as THREE from 'three';
import type { Color } from '../math/color.ts';
import { Drawable } from './drawable.ts';
import type { TDrawableMesh, TDrawableOpts, TMaterialWithCoreProps } from './drawable.ts';

export type TUniformMap = Record<string, THREE.IUniform>;

export type TShaderInjectPart = Readonly<{
	vars?: string;
	before?: string;
	after?: string;
}>;

export type TShaderInject = Readonly<{
	vert?: TShaderInjectPart;
	frag?: TShaderInjectPart;
}>;

export type TCloudOpts = TDrawableOpts & {
	attrs: Record<string, TCloudAttribute> & {
		size?: TCloudAttribute | number;
	};
	count: number;
	uniforms?: TUniformMap;
	depthTest?: boolean;
	vert?: string;
	frag?: string;
	inject?: TShaderInject;
	size?: number | string;
	mode?: 'segments' | 'loop' | string;
};

export type TCloudAttribute = Readonly<{
	vbo: WebGLBuffer;
	items: number;
}>;

export class Cloud extends Drawable {
	public constructor(opts: TCloudOpts) {
		super(opts);
	}
	
	public override get color(): null { return null; }
	public override set color(_value: Color | null) { /* do nothing */ }
	
	public buildAttr(source: TCloudAttribute, count: number): THREE.GLBufferAttribute {
		return new this.screen.three.GLBufferAttribute(
			source.vbo as unknown as WebGLBuffer,
			this.screen.context.FLOAT,
			source.items,
			4,
			count,
		);
	}
	
	public override _geo(opts: TCloudOpts): THREE.BufferGeometry {
		const geo = new this.screen.three.BufferGeometry();
		
		for (const key of Object.keys(opts.attrs)) {
			const attr = opts.attrs[key];
			if (attr && typeof attr === 'object') {
				geo.setAttribute(key, this.buildAttr(attr, opts.count) as unknown as THREE.BufferAttribute);
			}
		}
		geo.boundingSphere = new this.screen.three.Sphere(new this.screen.three.Vector3(), Infinity);
		
		return geo;
	}
	
	public override _mat(opts: TCloudOpts): TMaterialWithCoreProps {
		const uniforms = {
			...opts.uniforms,
			winh: { value: this.screen.height },
		};
		
		this.screen.on('resize', ({ height }: { height: number }) => { uniforms.winh.value = height; });
		
		return new this.screen.three.ShaderMaterial({
			blending: this.screen.three.NormalBlending,
			depthTest: opts.depthTest === true,
			transparent: true,
			uniforms,
			vertexShader: this.buildVert(opts),
			fragmentShader: this.buildFrag(opts),
		});
	}
	
	public buildVert(opts: TCloudOpts): string {
		return opts.vert || `
			attribute vec3  color;
			varying   vec3  varColor;
			
			${opts.inject?.vert?.vars ?? ''}
			
			void main() {
				
				${opts.inject?.vert?.before ?? ''}
				
				varColor        = color;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position     = projectionMatrix * mvPosition;
				
				${opts.inject?.vert?.after ?? ''}
				
			}
		`;
	}
	
	public buildFrag(opts: TCloudOpts): string {
		return opts.frag || `
			varying vec3  varColor;
			
			${opts.inject?.frag?.vars ?? ''}
			
			void main() {
				
				${opts.inject?.frag?.before ?? ''}
				
				// gl_FragColor = vec4(varColor, 1.0);
				gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				
				${opts.inject?.frag?.after ?? ''}
				
			}
		`;
	}
	
	public override _build(opts: TCloudOpts): TDrawableMesh {
		const points = new this.screen.three.Points(this._geo(opts), this._mat(opts));
		points.frustumCulled = false;
		(points as THREE.Points & { boundingSphere?: THREE.Sphere }).boundingSphere = new this.screen.three.Sphere(
			new this.screen.three.Vector3(),
			Infinity,
		);
		return points as unknown as TDrawableMesh;
	}
}
