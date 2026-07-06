export interface LoadVitePressEnvOptions {
    cwd?: string;
    mode?: string;
    localFallbackPath?: string;
    includeGitHash?: boolean;
    includeBuildTimestamp?: boolean;
}
export declare function resolveGitHash(): string;
export declare function readEnvFile(filePath: string): Record<string, string>;
export declare function loadVitePressEnv({ cwd, mode, localFallbackPath, includeGitHash, includeBuildTimestamp, }?: LoadVitePressEnvOptions): {
    [x: string]: string;
};
//# sourceMappingURL=env.d.ts.map