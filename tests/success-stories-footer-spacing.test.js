const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("success stories spacing and footer alignment contract", () => {
  test("scopes the success stories CTA spacing instead of relying on oversized shared section padding", () => {
    const page = read("frontend/app/success-stories/page.js");
    const globals = read("frontend/app/globals.css");

    expect(page).toContain('className="fj-section fj-section--tight fj-success-cta-section"');
    expect(page).toContain('className="fj-final-cta fj-success-final-cta"');
    expect(globals).toContain(".fj-success-cta-section {");
    expect(globals).toContain("padding-top: 32px;");
    expect(globals).toContain("padding-bottom: 68px;");
    expect(globals).toContain(".fj-success-final-cta {");
    expect(globals).toContain("padding: 64px 28px;");
  });

  test("keeps footer copy aligned instead of fully justified", () => {
    const globals = read("frontend/app/globals.css");

    expect(globals).toContain(".fj-footer-brand p {");
    expect(globals).toContain("text-align: left;");
    expect(globals).toContain(".fj-footer-bottom p {");
    expect(globals).toContain("text-align: center;");
  });

  test("uses different featured placement images instead of duplicating the same asset", () => {
    const page = read("frontend/app/success-stories/page.js");

    expect(page).toContain('image: "/framer/contact-panel-team.jpg"');
    expect(page).toContain('image: "/brand/about-candidate-story.jpg"');
  });
});
