import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
import type { TDrawableMesh } from './drawable.ts';
export declare class Tris extends Cloud {
    buildFrag(opts: TCloudOpts): string;
    _build(opts: TCloudOpts): TDrawableMesh;
}
