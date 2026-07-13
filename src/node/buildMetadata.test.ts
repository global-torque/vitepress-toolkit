import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { createBuildMetadata, resolveGitHash } from './buildMetadata';

describe('build metadata', () => {
  it('uses the declared Git cwd and injected clock without mutating process env', () => {
    const before = { ...process.env };
    const gitResolver = vi.fn(() => 'abc123');
    const metadata = createBuildMetadata({
      cwd: '/project/root',
      clock: () => new Date('2026-07-10T12:00:00.000Z'),
      resolveGitHash: gitResolver,
    });

    expect(metadata).toEqual({
      gitHash: 'abc123',
      timestamp: '2026-07-10T12:00:00.000Z',
    });
    expect(gitResolver).toHaveBeenCalledWith('/project/root');
    expect(process.env).toEqual(before);
    expect(Object.isFrozen(metadata)).toBe(true);
  });

  it('passes cwd to the Git runner and returns unknown on failure', () => {
    const runner = vi.fn(() => ' deadbee ');
    expect(resolveGitHash({ cwd: '/repo', runGit: runner })).toBe('deadbee');
    expect(runner).toHaveBeenCalledWith('/repo');
    expect(
      resolveGitHash({
        cwd: '/repo',
        runGit: () => {
          throw new Error('no git');
        },
      }),
    ).toBe('unknown');
    expect(resolveGitHash({ cwd: '/repo', runGit: () => '   ' })).toBe(
      'unknown',
    );
  });

  it('runs Git in an isolated repository and handles an archive directory', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vitepress-toolkit-git-'));

    try {
      expect(resolveGitHash({ cwd })).toBe('unknown');

      execFileSync('git', ['init', '--quiet'], { cwd });
      writeFileSync(join(cwd, 'fixture.txt'), 'fixture\n');
      execFileSync('git', ['add', 'fixture.txt'], { cwd });
      execFileSync(
        'git',
        [
          '-c',
          'user.name=VitePress Toolkit Test',
          '-c',
          'user.email=test@example.invalid',
          'commit',
          '--quiet',
          '-m',
          'Create fixture',
        ],
        { cwd },
      );

      const expected = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        cwd,
        encoding: 'utf8',
      }).trim();
      expect(resolveGitHash({ cwd })).toBe(expected);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
