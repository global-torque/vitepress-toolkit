import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadEnv } from 'vitepress';

export interface LoadVitePressEnvOptions {
  cwd?: string;
  mode?: string;
  localFallbackPath?: string;
  includeGitHash?: boolean;
  includeBuildTimestamp?: boolean;
}

export function resolveGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  }
  catch {
    return 'unknown';
  }
}

export function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((accumulator, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return accumulator;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex <= 0) {
        return accumulator;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();
      const quote = value[0];
      accumulator[key] = (
        (quote === '"' || quote === "'") && value.endsWith(quote)
          ? value.slice(1, -1)
          : value
      );
      return accumulator;
    }, {});
}

export function loadVitePressEnv({
  cwd = process.cwd(),
  mode = '',
  localFallbackPath,
  includeGitHash = false,
  includeBuildTimestamp = false,
}: LoadVitePressEnvOptions = {}) {
  if (includeGitHash) {
    process.env.VITE_GIT_HASH = process.env.VITE_GIT_HASH?.trim() || resolveGitHash();
  }

  if (includeBuildTimestamp) {
    process.env.VITE_BUILD_TIMESTAMP = process.env.VITE_BUILD_TIMESTAMP?.trim() || new Date().toISOString();
  }

  return {
    ...(localFallbackPath ? readEnvFile(path.resolve(cwd, localFallbackPath)) : {}),
    ...loadEnv(mode, cwd),
  };
}
