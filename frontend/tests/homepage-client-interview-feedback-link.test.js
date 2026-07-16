import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('homepage client interview feedback link', () => {
  test('includes a homepage CTA for the client interview feedback page', () => {
    const source = read('components/FeedbackStats.js');

    expect(source).toContain('href="/client-interview-feedback"');
    expect(source).toContain('Client Interview Feedback');
    expect(source).toContain('share client interview feedback');
  });
});
