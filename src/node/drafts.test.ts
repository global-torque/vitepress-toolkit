import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { findDraftFiles } from './drafts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitepress-drafts-'));
  roots.push(root);
  return root;
}

describe('findDraftFiles', () => {
  it('returns sorted root-relative POSIX paths for relative and absolute roots', () => {
    const root = temporaryRoot();
    fs.mkdirSync(path.join(root, 'nested'));
    fs.writeFileSync(path.join(root, 'z.md'), '---\ndraft: true\n---\n');
    fs.writeFileSync(
      path.join(root, 'nested', 'a.md'),
      '---\ndraft: true\n---\n',
    );
    fs.writeFileSync(
      path.join(root, 'published.md'),
      '---\ndraft: false\n---\n',
    );

    expect(findDraftFiles(root)).toEqual(['nested/a.md', 'z.md']);
    expect(findDraftFiles(path.relative(process.cwd(), root))).toEqual([
      'nested/a.md',
      'z.md',
    ]);
  });

  it('passes only relative paths to the host predicate', () => {
    const root = temporaryRoot();
    fs.writeFileSync(
      path.join(root, 'exclude.md'),
      '---\nkind: private\n---\n',
    );
    expect(
      findDraftFiles(root, {
        exclude: ({ relativePath, data }) =>
          relativePath === 'exclude.md' && data.kind === 'private',
      }),
    ).toEqual(['exclude.md']);
  });

  it('throws on malformed frontmatter by default and can explicitly skip', () => {
    const root = temporaryRoot();
    fs.writeFileSync(path.join(root, 'bad.md'), '---\n[invalid\n---\n');
    expect(() => findDraftFiles(root)).toThrow();
    expect(findDraftFiles(root, { onError: 'skip' })).toEqual([]);
  });

  it('rejects symlinks and traversal by default', () => {
    const root = temporaryRoot();
    const outside = temporaryRoot();
    fs.writeFileSync(
      path.join(outside, 'secret.md'),
      '---\ndraft: true\n---\n',
    );
    fs.symlinkSync(
      path.join(outside, 'secret.md'),
      path.join(root, 'linked.md'),
    );
    expect(findDraftFiles(root)).toEqual([]);
    expect(() => findDraftFiles(root, { allowSymlinks: true })).toThrow(
      /escaped/,
    );
  });

  it('allows an explicitly enabled in-root file symlink', () => {
    const root = temporaryRoot();
    const target = path.join(root, 'target.md');
    fs.writeFileSync(target, '---\ndraft: true\n---\n');
    fs.symlinkSync(target, path.join(root, 'alias.md'));

    expect(findDraftFiles(root, { allowSymlinks: true })).toEqual([
      'alias.md',
      'target.md',
    ]);
  });

  it('throws on unreadable files by default and supports explicit skipping', () => {
    const root = temporaryRoot();
    const unreadable = path.join(root, 'unreadable.md');
    fs.writeFileSync(unreadable, '---\ndraft: true\n---\n');
    fs.chmodSync(unreadable, 0o000);

    expect(() => findDraftFiles(root)).toThrow();
    expect(findDraftFiles(root, { onError: 'skip' })).toEqual([]);
  });

  it('sorts using locale-independent code-point order', () => {
    const root = temporaryRoot();
    for (const name of ['ä.md', 'a.md', 'B.md']) {
      fs.writeFileSync(path.join(root, name), '---\ndraft: true\n---\n');
    }
    expect(findDraftFiles(root)).toEqual(['B.md', 'a.md', 'ä.md']);
  });

  it('validates root type and root symlink policy', () => {
    const root = temporaryRoot();
    const fileRoot = path.join(root, 'file.md');
    fs.writeFileSync(fileRoot, '---\ndraft: true\n---\n');
    expect(() => findDraftFiles(fileRoot)).toThrow(TypeError);

    const linkedRoot = `${root}-link`;
    fs.symlinkSync(root, linkedRoot);
    roots.push(linkedRoot);
    expect(() => findDraftFiles(linkedRoot)).toThrow(/symbolic link/);
    expect(findDraftFiles(linkedRoot, { allowSymlinks: true })).toEqual([
      'file.md',
    ]);
  });

  it('traverses an allowed directory symlink once and ignores non-Markdown files', () => {
    const root = temporaryRoot();
    const target = path.join(root, 'target');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'draft.md'), '---\ndraft: true\n---\n');
    fs.writeFileSync(path.join(target, 'notes.txt'), 'draft: true');
    fs.symlinkSync(target, path.join(root, 'alias'));

    expect(findDraftFiles(root, { allowSymlinks: true })).toEqual([
      'alias/draft.md',
    ]);
  });
});
