const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("homepage feedback stats contract", () => {
  test("uses the refreshed stat card treatment while keeping home page metrics", () => {
    const stats = read("frontend/components/FeedbackStats.js");

    expect(stats).toContain('{ value: 50, suffix: "+", label: "Interviews Arranged", icon: CalendarCheck }');
    expect(stats).toContain('{ value: 40, suffix: "+", label: "Successful Placements", icon: ShieldCheck }');
    expect(stats).toContain("HoverCard");
    expect(stats).toContain('width: "56px"');
    expect(stats).toContain('fontSize: "2.5rem"');
    expect(stats).not.toContain("fj-stat-underline");
  });
});
