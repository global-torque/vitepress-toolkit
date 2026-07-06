export interface DraftExcludeContext {
    filePath: string;
    data: Record<string, unknown>;
}
export type DraftExcludePredicate = (context: DraftExcludeContext) => boolean;
export interface FindDraftFilesOptions {
    exclude?: DraftExcludePredicate;
}
export declare function findDraftFiles(dirPath: string, options?: FindDraftFilesOptions): string[];
//# sourceMappingURL=drafts.d.ts.map