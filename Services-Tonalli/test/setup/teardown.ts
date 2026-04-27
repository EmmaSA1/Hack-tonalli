import { existsSync, readFileSync, rmSync } from 'node:fs';
import { TEST_CLEANUP_PATH } from './test-fixtures';

interface CleanupConfig {
  removeFiles?: string[];
}

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(TEST_CLEANUP_PATH)) {
    return;
  }

  const cleanup = JSON.parse(
    readFileSync(TEST_CLEANUP_PATH, 'utf8'),
  ) as CleanupConfig;

  for (const filePath of cleanup.removeFiles ?? []) {
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
    }
  }
}
