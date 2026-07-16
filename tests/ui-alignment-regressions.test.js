const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("ui alignment regressions", () => {
  test("keeps the homepage media story copy centered like the rest of the site headings", () => {
    const globals = read("frontend/app/globals.css");

    expect(globals).toContain(".fj-homepage .fj-home-section--media .fj-leader-card > :first-child {");
    expect(globals).toContain("justify-items: center;");
    expect(globals).toContain("text-align: center;");
  });

  test("keeps social blog cards stacked so their CTA labels stay centered", () => {
    const globals = read("frontend/app/globals.css");

    expect(globals).toContain(".fj-blog-card {");
    expect(globals).toContain("display: flex;");
    expect(globals).toContain("flex-direction: column;");
    expect(globals).toContain(".fj-social-blog-card {");
  });

  test("adds breathing room between pricing details and pricing buttons", () => {
    const globals = read("frontend/app/globals.css");
    const pricingPage = read("frontend/app/pricing/page.js");

    expect(globals).toContain(".fj-pricing-actions {");
    expect(globals).toContain("margin-top: 28px;");
    expect(globals).toContain("padding-top: 8px;");
    expect(globals).toContain(".fj-pricing-actions .fj-button {");
    expect(globals).toContain("margin-top: 0;");
    expect(globals).toContain("width: 100%;");
    expect(pricingPage).not.toContain("marginTop: 'auto'");
  });

  test("keeps extra pricing spacing on mobile cards too", () => {
    const globals = read("frontend/app/globals.css");

    expect(globals).toContain("@media (max-width: 480px) {");
    expect(globals).toContain(".fj-pricing-card {");
    expect(globals).toContain("padding: 28px 24px 32px;");
    expect(globals).toContain(".fj-pricing-actions {");
    expect(globals).toContain("margin-top: 32px;");
    expect(globals).toContain("padding-top: 12px;");
  });
});
