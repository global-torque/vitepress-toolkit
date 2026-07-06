import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface DraftExcludeContext {
  filePath: string;
  data: Record<string, unknown>;
}

export type DraftExcludePredicate = (context: DraftExcludeContext) => boolean;

export interface FindDraftFilesOptions {
  exclude?: DraftExcludePredicate;
}

function findDrafts(dirPath: string, options: FindDraftFilesOptions) {
  const draftFiles: string[] = [];
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      draftFiles.push(...findDrafts(filePath, options));
      return;
    }

    if (!stats.isFile() || !filePath.endsWith('.md')) {
      return;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      if (data.draft === true || options.exclude?.({ filePath, data }) === true) {
        draftFiles.push(filePath);
      }
    }
    catch (error) {
      console.error(error);
    }
  });

  return draftFiles;
}

export function findDraftFiles(dirPath: string, options: FindDraftFilesOptions = {}) {
  return findDrafts(dirPath, options).map((draftFile) => (
    `./${draftFile.slice(dirPath.length - 1)}`
  ));
}
