import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('admin dashboard client interview feedback section', () => {
  const page = () => read('app/admin/dashboard/page.js');

  test('adds a dashboard stat and a dedicated client interview feedback table', () => {
    const source = page();

    expect(source).toContain("import ClientInterviewFeedback from '@/models/ClientInterviewFeedback'");
    expect(source).toContain("import ClientInterviewFeedbackActions from '@/components/admin/ClientInterviewFeedbackActions'");
    expect(source).toContain("ClientInterviewFeedback.countDocuments({})");
    expect(source).toContain("ClientInterviewFeedback.find({}).sort({ created_at: -1 }).limit(10).lean()");
    expect(source).toContain("label: 'Client Interview Feedback'");
    expect(source).toContain('<h2>Client Interview Feedback</h2>');
    expect(source).toContain('Latest responses submitted from the client interview feedback form.');
    expect(source).toContain('<th>Full Name</th>');
    expect(source).toContain('<th>Email</th>');
    expect(source).toContain('<th>Interview Type</th>');
    expect(source).toContain('<th>Interview Result</th>');
    expect(source).toContain('<th>Feedback</th>');
    expect(source).toContain('<th>Submitted</th>');
    expect(source).toContain('<th>Actions</th>');
    expect(source).toContain('ClientInterviewFeedbackActions');
    expect(source).toContain('No client interview feedback has been submitted yet.');
  });
});
