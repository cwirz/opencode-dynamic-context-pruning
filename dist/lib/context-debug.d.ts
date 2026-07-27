export type ContextSnapshot = {
    version: 1;
    capturedAt: string;
    sessionId: string;
    system: string[];
    messages: any[];
    request?: {
        input: any;
        output: any;
    };
};
export declare function renderContextSnapshot(snapshot: ContextSnapshot): string;
export declare function writeContextViewer(contextDir: string, fileStem: string, snapshot: ContextSnapshot): Promise<void>;
//# sourceMappingURL=context-debug.d.ts.map