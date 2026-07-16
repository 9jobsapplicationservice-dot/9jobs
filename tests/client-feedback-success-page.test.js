const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('client service feedback success page', () => {
  const page = () => read('frontend/app/client-service-feedback/page.js');
  const styles = () => read('frontend/app/globals.css');

  test('uses the requested thank-you message and action buttons', () => {
    const source = page();

    expect(source).toContain('Thank You for Your Feedback!');
    expect(source).toContain(
      'Your feedback has been submitted successfully. We appreciate your partnership with 9Jobs and value your input in helping us improve our recruitment and staffing services.'
    );
    expect(source).not.toContain('Submit Another');
    expect(source).toContain('href="https://9jobs.co"');
    expect(source).toContain('Back to Home');
    expect(source).toContain('href="https://9jobs.co/client-service-feedback"');
    expect(source).toContain('Leave Another Review');
  });

  test('adds accessible social links that open in a new tab', () => {
    const source = page();

    expect(source).toContain('Stay Connected with 9Jobs');
    expect(source).toContain('Visit our Instagram');
    expect(source).toContain('https://www.instagram.com/9jobsau');
    expect(source).toContain('Connect with us on LinkedIn');
    expect(source).toContain('https://www.linkedin.com/company/9jobs/');
    expect(source).toContain('Follow us on Facebook');
    expect(source).toContain('https://www.facebook.com/profile.php?id=61589408708559');
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
  });

  test('promotes the official website with responsive animated styling hooks', () => {
    const source = page();
    const css = styles();

    expect(source).toContain('Explore More with 9Jobs');
    expect(source).toContain(
      'Visit the official 9Jobs website to discover recruitment solutions, staffing services, employer resources, workforce management support and career opportunities across Australia.'
    );
    expect(source).toContain('Visit 9Jobs Website');
    expect(source).toContain('feedback-success-shell');
    expect(css).toContain('.feedback-success-shell');
    expect(css).toContain('@keyframes feedback-success-fade');
    expect(css).toContain('.feedback-social-link');
    expect(css).toContain('@media (max-width: 640px)');
  });
});
