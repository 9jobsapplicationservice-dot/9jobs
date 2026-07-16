import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('client interview feedback page', () => {
  const page = () => read('app/client-interview-feedback/page.js');
  const route = () => read('app/api/client-interview-feedback/route.js');
  const model = () => read('models/ClientInterviewFeedback.js');
  const rootVercelConfig = () => read('../vercel.json');

  test('renders the requested form fields and submit flow', () => {
    const source = page();

    expect(source).toContain('Client Interview');
    expect(source).toContain('Feedback</span>');
    expect(source).toContain('name="full_name"');
    expect(source).toContain('type="email"');
    expect(source).toContain('name="interview_type"');
    expect(source).toContain('Phone Interview');
    expect(source).toContain('Video Interview');
    expect(source).toContain('Face-to-Face Interview');
    expect(source).toContain('Waiting for Response');
    expect(source).toContain('Shortlisted');
    expect(source).toContain('Invited for Second Interview');
    expect(source).toContain('Job Offer Received');
    expect(source).toContain('Rejected');
    expect(source).toContain('Please share the interview questions that were asked, any challenges you faced, and any additional feedback or suggestions for the 9Jobs team.');
    expect(source).toContain('fetch("/api/client-interview-feedback"');
    expect(source).toContain('Submit Feedback');
    expect(source).toContain('Thank You for Your Feedback');
  });

  test('stores the required schema and route validations', () => {
    const routeSource = route();
    const modelSource = model();
    const vercelSource = rootVercelConfig();

    expect(routeSource).toContain("Full Name is required.");
    expect(routeSource).toContain("Email Address is required.");
    expect(routeSource).toContain("Please enter a valid email address.");
    expect(routeSource).toContain("Please select a valid Interview Type.");
    expect(routeSource).toContain("Please select a valid Interview Result.");
    expect(routeSource).toContain("Interview Feedback is required.");
    expect(modelSource).toContain('full_name');
    expect(modelSource).toContain('email_address');
    expect(modelSource).toContain('interview_type');
    expect(modelSource).toContain('interview_result');
    expect(modelSource).toContain('interview_feedback');
    expect(vercelSource).toContain('client-interview-feedback');
  });
});
