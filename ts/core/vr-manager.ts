export class WebVRManager {
	public get enabled(): boolean { return false; }
	
	public isPresenting(): boolean { return false; }
	public dispose(): void { /* nop */ }
	public setAnimationLoop(): void { /* nop */ }
	public getCamera(): Readonly<Record<string, never>> { return {}; }
	public submitFrame(): void { /* nop */ }
}

export default WebVRManager;
