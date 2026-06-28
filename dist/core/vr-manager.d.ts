export declare class WebVRManager {
    get enabled(): boolean;
    isPresenting(): boolean;
    dispose(): void;
    setAnimationLoop(): void;
    getCamera(): Readonly<Record<string, never>>;
    submitFrame(): void;
}
export default WebVRManager;
