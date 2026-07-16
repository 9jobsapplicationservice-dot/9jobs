import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('admin client interview feedback management', () => {
  test('includes edit form and delete action for client interview feedback', () => {
    const detailPage = read('app/admin/client-interview-feedback/[id]/page.js');
    const form = read('components/admin/ClientInterviewFeedbackForm.js');
    const actions = read('components/admin/ClientInterviewFeedbackActions.js');
    const route = read('app/api/client-interview-feedback/[id]/route.js');
    const css = read('app/globals.css');

    expect(detailPage).toContain('Edit Client Interview Feedback');
    expect(form).toContain("fetch(`/api/client-interview-feedback/${feedback._id}`");
    expect(form).toContain("method: 'PATCH'");
    expect(form).toContain('Update Feedback');
    expect(actions).toContain("method: 'DELETE'");
    expect(actions).toContain('Delete this client interview feedback entry?');
    expect(actions).toContain('Client interview feedback deleted.');
    expect(route).toContain('export async function PATCH');
    expect(route).toContain('export async function DELETE');
    expect(route).toContain('Unauthorized.');
    expect(css).toContain('.admin-link--danger');
  });
});
