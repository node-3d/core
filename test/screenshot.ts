import { matchScreenshot } from '../ts/testing/index.ts';
import { doc, Image } from './init.ts';

const screenshot = (name: string): Promise<boolean> =>
	matchScreenshot(name, {
		width: doc.w,
		height: doc.h,
		context: doc.context,
		Image,
	});

export { screenshot };
export default { screenshot };
