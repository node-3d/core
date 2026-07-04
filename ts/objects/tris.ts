import type * as THREE from 'three';
import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
import type { TDrawableMesh } from './drawable.ts';

export class Tris extends Cloud {
	public override buildFrag(opts: TCloudOpts): string {
		return (
			opts.frag ||
			`
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;
			
			${opts.inject && opts.inject.frag && opts.inject.frag.vars ? opts.inject.frag.vars : ''}
			
			void main() {
				
				${
					opts.inject && opts.inject.frag && opts.inject.frag.before
						? opts.inject.frag.before
						: ''
				}
				
				gl_FragColor = vec4(varColor, 1.0);
				
				${
					opts.inject && opts.inject.frag && opts.inject.frag.after
						? opts.inject.frag.after
						: ''
				}
				
			}
		`
		);
	}

	public override _build(opts: TCloudOpts): TDrawableMesh {
		const tris = new this.screen.three.Mesh(this._geo(opts), this._mat(opts));
		tris.frustumCulled = false;
		(tris as THREE.Mesh & { boundingSphere?: THREE.Sphere }).boundingSphere =
			new this.screen.three.Sphere(new this.screen.three.Vector3(), Infinity);
		return tris as unknown as TDrawableMesh;
	}
}
