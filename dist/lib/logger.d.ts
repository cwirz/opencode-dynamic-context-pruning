export declare class Logger {
    private logDir;
    private systemBySession;
    private latestSnapshotBySession;
    enabled: boolean;
    constructor(enabled: boolean, logDir?: string);
    private ensureLogDir;
    private formatData;
    private getCallerFile;
    private write;
    info(message: string, data?: any): Promise<void>;
    debug(message: string, data?: any): Promise<void>;
    warn(message: string, data?: any): Promise<void>;
    error(message: string, data?: any): Promise<void>;
    captureSystemContext(sessionId: string, system: string[]): Promise<void>;
    captureRequestContext(sessionId: string, input: any, output: any): Promise<void>;
    saveContext(sessionId: string, messages: any[]): Promise<void>;
}
//# sourceMappingURL=logger.d.ts.map