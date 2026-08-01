import { matchScreenshot } from '../ts/testing/index.ts';
import { doc } from './init.ts';

const screenshot = (name: string): Promise<boolean> =>
	matchScreenshot(name, {
		doc,
	});

export { screenshot };
export default { screenshot };
