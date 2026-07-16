import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('visible branding copy', () => {
  test('keeps footer brand copy free from the retired volume claim', () => {
    const footerSource = read('components/Footer.js');

    expect(footerSource).not.toContain('40,000+');
    expect(footerSource).not.toContain('40000+');
    expect(footerSource).toContain('Join businesses in Australia using 9Jobs today.');
  });

  test('uses 9Jobs branding across visible non-SEO UI copy', () => {
    const footerSource = read('components/Footer.js');
    const aboutSource = read('app/about/page.js');
    const adminLoginSource = read('app/admin/login/page.js');

    expect(footerSource).toContain('label: "Brand Page"');
    expect(footerSource).toContain('label: "Jobs Australia"');
    expect(footerSource).toContain('label: "Resume Service"');
    expect(footerSource).toContain('label: "Career Support"');
    expect(footerSource).not.toContain('label: "9Jobs"');
    expect(footerSource).not.toContain('label: "9Jobs Australia"');
    expect(footerSource).not.toContain('label: "9Jobs Resume Service"');
    expect(footerSource).not.toContain('label: "9Jobs Career Support"');
    expect(aboutSource).toContain('9Jobs helps professionals across Australia');
    expect(aboutSource).not.toContain('9jobs, also known as 9 Jobs');
    expect(adminLoginSource).toContain('9Jobs Service Contract');
    expect(adminLoginSource).not.toContain('9 Jobs Service Contract');
  });
});
