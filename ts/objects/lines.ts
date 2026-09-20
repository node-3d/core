import * as THREE from 'three';
import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
import type { TDrawableMesh } from './drawable.ts';

export class Lines extends Cloud {
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

				gl_FragColor = vec4(varColor, 1.0);

				${opts.inject?.frag?.after ?? ''}

			}
		`
		);
	}

	public override _build(opts: TCloudOpts): TDrawableMesh {
		const Ctor = (() => {
			const optsMode = opts.mode;
			if (!optsMode) {
				return THREE.Line;
			}
			switch (optsMode) {
				case 'segments':
					return THREE.LineSegments;
				case 'loop':
					return THREE.LineLoop;
				default:
					return THREE.Line;
			}
		})();
		const lines = new Ctor(this._geo(opts), this._mat(opts));
		lines.frustumCulled = false;
		(lines as THREE.Line & { boundingSphere?: THREE.Sphere }).boundingSphere = new THREE.Sphere(
			new THREE.Vector3(),
			Infinity,
		);
		return lines;
	}
}
