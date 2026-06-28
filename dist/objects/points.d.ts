import { Cloud } from './cloud.ts';
import type { TCloudOpts } from './cloud.ts';
export declare class Points extends Cloud {
    buildVert(opts: TCloudOpts): string;
    buildFrag(opts: TCloudOpts): string;
}
