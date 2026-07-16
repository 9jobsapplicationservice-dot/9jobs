const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("homepage feedback stats style scope", () => {
  test("locks the home stats section to its refreshed visual treatment", () => {
    const component = read("frontend/components/FeedbackStats.js");
    const css = read("frontend/app/globals.css");

    expect(component).toContain("fj-feedback-stats");
    expect(css).toContain(".fj-homepage .fj-feedback-stats .fj-stat-card");
    expect(css).toContain(".fj-homepage .fj-feedback-stats .fj-stat-icon");
    expect(css).toContain("background: var(--lime) !important;");
    expect(css).toContain("width: 56px !important;");
    expect(css).toContain("font-size: 2.5rem !important;");
  });
});
