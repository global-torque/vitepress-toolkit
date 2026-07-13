import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Detached path and parsed frontmatter supplied to a draft predicate.
 *
 * @public
 */
export interface DraftFileContext {
  /** POSIX path relative to the declared root. */
  readonly relativePath: string;
  /** Shallow-frozen parsed frontmatter. */
  readonly data: Readonly<Record<string, unknown>>;
}

/** Host predicate that can exclude non-draft content from a build. @public */
export type DraftExcludePredicate = (context: DraftFileContext) => boolean;

/**
 * Explicit traversal, symlink, and error policy for draft discovery.
 *
 * @public
 */
export interface FindDraftFilesOptions {
  /** Host predicate whose `true` result includes a file in the exclusion list. */
  exclude?: DraftExcludePredicate;
  /** Follow only in-root symlinks. Defaults to `false`. */
  allowSymlinks?: boolean;
  /** Throw on filesystem/frontmatter failures or skip the failed entry. */
  onError?: 'throw' | 'skip';
}

function isContained(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Discover draft Markdown files as sorted POSIX paths relative to root.
 *
 * @public
 */
export function findDraftFiles(
  declaredRoot: string,
  options: FindDraftFilesOptions = {},
): readonly string[] {
  const root = path.resolve(declaredRoot);
  const rootLstat = fs.lstatSync(root);
  if (rootLstat.isSymbolicLink() && options.allowSymlinks !== true) {
    throw new Error(`Draft root must not be a symbolic link: ${declaredRoot}`);
  }
  const rootStat = rootLstat.isSymbolicLink() ? fs.statSync(root) : rootLstat;
  if (!rootStat.isDirectory()) {
    throw new TypeError(`Draft root is not a directory: ${declaredRoot}`);
  }
  const rootRealpath = fs.realpathSync(root);
  const visitedDirectories = new Set<string>();
  const result: string[] = [];

  const handleError = (error: unknown): void => {
    if ((options.onError ?? 'throw') === 'throw') throw error;
  };

  const visit = (directory: string): void => {
    let realDirectory: string;
    try {
      realDirectory = fs.realpathSync(directory);
      if (!isContained(rootRealpath, realDirectory)) {
        throw new Error(
          `Draft traversal escaped the declared root: ${directory}`,
        );
      }
      if (visitedDirectories.has(realDirectory)) return;
      visitedDirectories.add(realDirectory);

      const entries = fs
        .readdirSync(directory, { withFileTypes: true })
        .sort((left, right) => compareCodePoints(left.name, right.name));

      for (const entry of entries) {
        const absolutePath = path.join(directory, entry.name);
        try {
          const lstat = fs.lstatSync(absolutePath);
          if (lstat.isSymbolicLink()) {
            if (options.allowSymlinks !== true) {
              continue;
            }
            const realTarget = fs.realpathSync(absolutePath);
            if (!isContained(rootRealpath, realTarget)) {
              throw new Error(
                `Draft symbolic link escaped the declared root: ${absolutePath}`,
              );
            }
            const targetStat = fs.statSync(absolutePath);
            if (targetStat.isDirectory()) visit(absolutePath);
            else if (targetStat.isFile()) visitFile(absolutePath);
          } else if (lstat.isDirectory()) {
            visit(absolutePath);
          } else if (lstat.isFile()) {
            visitFile(absolutePath);
          }
        } catch (error) {
          handleError(error);
        }
      }
    } catch (error) {
      handleError(error);
    }
  };

  const visitFile = (absolutePath: string): void => {
    if (!absolutePath.toLowerCase().endsWith('.md')) return;
    const realFile = fs.realpathSync(absolutePath);
    if (!isContained(rootRealpath, realFile)) {
      throw new Error(`Draft file escaped the declared root: ${absolutePath}`);
    }
    const parsed = matter(fs.readFileSync(absolutePath, 'utf8'));
    const relativePath = toPosix(path.relative(root, absolutePath));
    const data = Object.freeze({ ...parsed.data });
    if (
      data.draft === true ||
      options.exclude?.({ relativePath, data }) === true
    ) {
      result.push(relativePath);
    }
  };

  visit(root);
  return Object.freeze([...new Set(result)].sort(compareCodePoints));
}
