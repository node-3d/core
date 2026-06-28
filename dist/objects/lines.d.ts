import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
import type { TDrawableMesh } from './drawable.ts';
export declare class Lines extends Cloud {
    buildFrag(opts: TCloudOpts): string;
    _build(opts: TCloudOpts): TDrawableMesh;
}
