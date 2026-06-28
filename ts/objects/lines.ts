import type * as THREE from 'three';
import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
import type { TDrawableMesh } from './drawable.ts';

export class Lines extends Cloud {
	public override buildFrag(opts: TCloudOpts): string {
		return opts.frag || `
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;
			
			${
	opts.inject && opts.inject.frag && opts.inject.frag.vars
		? opts.inject.frag.vars
		: ''
}
			
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
		`;
	}
	
	
	public override _build(opts: TCloudOpts): TDrawableMesh {
		const Ctor = (() => {
			switch (opts.mode) {
				case 'segments': {
					return this.screen.three.LineSegments;
				}
				case 'loop': {
					return this.screen.three.LineLoop;
				}
				default: {
					return this.screen.three.Line;
				}
			}
		})();
		const lines = new Ctor(this._geo(opts), this._mat(opts));
		lines.frustumCulled = false;
		(lines as THREE.Line & { boundingSphere?: THREE.Sphere }).boundingSphere = new this.screen.three.Sphere(
			new this.screen.three.Vector3(),
			Infinity,
		);
		return lines as unknown as TDrawableMesh;
	}
	
}
