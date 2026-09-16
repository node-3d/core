import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';

export class Points extends Cloud {
	public override buildVert(opts: TCloudOpts): string {
		return (
        opts.vert ??
			`
			${
				typeof opts.attrs.size === 'number' && opts.attrs.size > 0
					? 'attribute float size'
                : `float size = ${opts.size ?? '10.0'}`
			};
			attribute vec3  color;
			varying   vec3  varColor;
			varying   vec2  varTcoord;
			varying   float varSize;

			uniform   float winh;

			${opts.inject?.vert?.vars ?? ''}

			void main() {

				${opts.inject?.vert?.before ?? ''}

				varColor        = color;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position     = projectionMatrix * mvPosition;
				varSize         = size;
				gl_PointSize    = max(2.0, 2.0 * winh * varSize / length( mvPosition.xyz ));
				varTcoord       = position.xy;

				${opts.inject?.vert?.after ?? ''}

			}
		`
		);
	}

	public override buildFrag(opts: TCloudOpts): string {
		return (
        opts.frag ??
			`
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;

			${opts.inject?.frag?.vars ?? ''}

			void main() {

				${opts.inject?.frag?.before ?? ''}

				float offs = length(gl_PointCoord.xy - vec2(0.5, 0.5));
				float dist = clamp(1.0 - 2.0 * offs, 0.0, 1.0) * 0.2 * varSize;
				dist = pow(dist, 5.0);
				gl_FragColor = vec4(varColor, dist);

				${opts.inject?.frag?.after ?? ''}

			}
		`
		);
	}
}
