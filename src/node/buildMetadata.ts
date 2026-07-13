import { execFileSync } from 'node:child_process';

/**
 * Explicit working directory and optional process adapter for Git resolution.
 *
 * @public
 */
export interface ResolveGitHashOptions {
  /** Git working directory. */
  cwd: string;
  /** Injected Git command adapter; the default runs `git rev-parse`. */
  runGit?: (cwd: string) => string;
}

/**
 * Explicit dependencies used to create deterministic build metadata.
 *
 * @public
 */
export interface CreateBuildMetadataOptions {
  /** Git working directory passed to the resolver. */
  cwd: string;
  /** Host-owned build clock. */
  clock: () => Date;
  /** Host-owned Git hash resolver. */
  resolveGitHash: (cwd: string) => string;
}

function runGit(cwd: string): string {
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/**
 * Resolve the short Git hash, returning `unknown` on command failure or empty output.
 *
 * @public
 */
export function resolveGitHash(input: ResolveGitHashOptions): string {
  const { cwd, runGit: resolver = runGit } = input;
  try {
    return resolver(cwd).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Create a frozen Git-hash and ISO timestamp record from injected dependencies.
 *
 * @public
 */
export function createBuildMetadata(
  input: CreateBuildMetadataOptions,
): Readonly<{
  gitHash: string;
  timestamp: string;
}> {
  const { cwd, clock, resolveGitHash: gitResolver } = input;
  return Object.freeze({
    gitHash: gitResolver(cwd),
    timestamp: clock().toISOString(),
  });
}
