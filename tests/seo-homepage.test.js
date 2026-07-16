const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readFiles(dir) {
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relativePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readFiles(relativePath);
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) return [];
    return [{ relativePath, content: read(relativePath) }];
  });
}

const expectedTitle = "9 Jobs Australia | 9jobs Resume Writing & Job Application Services";
const expectedDescription =
  "9jobs, also known as 9 Jobs, helps Australian professionals with Resume Writing Australia, LinkedIn Optimization, ATS Resume support, and Job Application Services.";
const expectedLandingTitle = "9 Jobs Australia | Resume Writing & Job Application Services";

describe("homepage technical SEO contract", () => {
  test("uses the brand-search metadata everywhere the homepage can inherit it", () => {
    const layout = read("frontend/app/layout.js");
    const page = read("frontend/app/page.js");
    const combined = `${layout}\n${page}`;

    expect(combined).not.toContain("9Jobs | Smarter Job Applying");
    expect(combined).toContain(expectedTitle);
    expect(combined).toContain(expectedDescription);
    expect(page).toContain('canonical: new URL("https://9jobs.co/")');
    expect(layout).not.toContain('canonical: "/"');
    expect(page).toContain("openGraph:");
    expect(page).toContain("title: homepageTitle");
    expect(page).toContain("description: homepageDescription");
    expect(page).toContain("keywords:");
    expect(page).toContain("9jobs");
    expect(page).toContain("9 Jobs");
    expect(page).toContain("twitter:");
    expect(page).not.toContain('href="/feature"');
  });

  test("keeps the homepage to one brand H1", () => {
    const page = read("frontend/app/page.js");

    expect((page.match(/<h1\b/g) || []).length).toBe(1);
    expect(page).toContain("9 Jobs Australia");
    expect(page).toContain("9jobs career support");
  });

  test("publishes organization and website schema with social identity", () => {
    const layout = read("frontend/app/layout.js");

    expect(layout).toContain('"@type": "Organization"');
    expect(layout).toContain('"name": "9jobs"');
    expect(layout).toContain('"areaServed"');
    expect(layout).toContain("https://www.linkedin.com/company/9jobs/");
    expect(layout).toContain("https://www.facebook.com/9jobs.co");
    expect(layout).toContain("https://www.instagram.com/9jobsau/");
    expect(layout).toContain("https://www.youtube.com/@9jobs");
    expect(layout).toContain('"@type": "SearchAction"');
    expect(layout).toContain('"alternateName"');
    expect(layout).toContain("9 Jobs");
    expect(layout).toContain("9jobs.co");
  });

  test("adds branded PAA coverage, semantic copy, and strong internal service links to the homepage", () => {
    const page = read("frontend/app/page.js");
    const navbar = read("frontend/components/Navbar.js");

    expect(page).toContain("What is 9Jobs?");
    expect(page).toContain("Is 9 Jobs Australia a recruitment agency?");
    expect(page).toContain("How does 9 Jobs work?");
    expect(page).toContain("Does 9 Jobs help with resumes?");
    expect(page).toContain("What should I do after visiting 9jobs.co?");
    expect(page).toContain("Resume Writing Australia");
    expect(page).toContain("LinkedIn Optimization");
    expect(page).toContain("Job Application Services");
    expect(page).toContain("ATS Resume");
    expect(page).toContain("/services/resume-writing");
    expect(page).toContain("/services/linkedin-optimization");
    expect(page).toContain("/services/seek-profile-optimization");
    expect(page).toContain("/services/job-application-automation");
    expect(page).toContain("/services/interview-coaching");
    expect(page).toContain("/9-jobs");
    expect(navbar).not.toContain('href: "/9-jobs"');
  });

  test("adds homepage webpage schema aligned with the brand entity", () => {
    const page = read("frontend/app/page.js");

    expect(page).toContain('"@type": "WebPage"');
    expect(page).toContain('"name": "9 Jobs Australia"');
    expect(page).toContain('"isPartOf"');
    expect(page).toContain('"about"');
  });

  test("keeps crawl discovery and canonical route consolidation configured", () => {
    const robots = read("frontend/app/robots.js");
    const sitemap = read("frontend/app/sitemap.js");
    const seo = read("frontend/data/seo.js");
    const config = read("frontend/next.config.mjs");

    expect(robots).toContain('userAgent: "*"');
    expect(robots).toContain('allow: "/"');
    expect(robots).not.toContain("disallow");
    expect(robots).toContain('sitemap: "https://9jobs.co/sitemap.xml"');
    expect(sitemap).toContain("siteRoutes.map");
    expect(seo).toContain('path: "/jobs/melbourne"');
    expect(seo).toContain('path: "/services/resume-writing"');
    expect(seo).toContain('path: "/9-jobs"');
    expect(seo).not.toContain('path: "/jobs-in-melbourne"');
    expect(seo).not.toContain('path: "/resume-writing-services-australia"');
    expect(config).toContain('{ source: "/jobs-in-melbourne", destination: "/jobs/melbourne", statusCode: 301 }');
    expect(config).toContain('{ source: "/jobs-melbourne", destination: "/jobs/melbourne", statusCode: 301 }');
    expect(config).toContain('{ source: "/get-jobs-in-melbourne", destination: "/jobs/melbourne", statusCode: 301 }');
    expect(config).toContain('{ source: "/feature", destination: "/features", statusCode: 301 }');
  });

  test("does not link page content to redirected legacy URLs", () => {
    const legacyRoutePattern =
      /(?<![\w-])\/(?:resume-writing-services-australia|linkedin-optimization-australia|seek-profile-optimization|job-application-services-australia|interview-support-australia|get-jobs-in-(?:sydney-nsw|melbourne|brisbane-qld|perth-wa|adelaide-sa)|jobs-in-melbourne|jobs-melbourne)(?![\w-])/;
    const files = [
      ...readFiles("frontend/app"),
      ...readFiles("frontend/components"),
      ...readFiles("frontend/data"),
    ];
    const offenders = files
      .filter(({ relativePath }) => !relativePath.endsWith(path.normalize("app/robots.js")))
      .filter(({ relativePath }) => !relativePath.endsWith(path.normalize("app/sitemap.js")))
      .filter(({ content }) => legacyRoutePattern.test(content))
      .map(({ relativePath }) => relativePath);

    expect(offenders).toEqual([]);
    expect(read("frontend/app/jobs/[city]/[slug]/page.js")).toContain('href={`/jobs/${city}`}');
  });

  test("keeps database environment validation lazy for clean static builds", () => {
    const db = read("frontend/utils/db.js");

    expect(db).not.toContain("console.warn");
    expect(db).toContain("process.env.MONGODB_URI");
    expect(db).toContain("throw new Error");
  });

  test("adds the dedicated 9 Jobs landing page and about-brand copy", () => {
    const landing = read("frontend/app/9-jobs/page.js");
    const about = read("frontend/app/about/page.js");

    expect(landing).toContain(expectedLandingTitle);
    expect(landing).toContain("9 jobs australia");
    expect(landing).toContain("9 jobs resume writing");
    expect(landing).toContain("9 jobs career support");
    expect(landing).toContain("9 jobs linkedin optimization");
    expect(landing).toContain("createBreadcrumbSchema");
    expect(about).toContain("9jobs, also known as 9 Jobs, helps professionals across Australia improve resumes, optimize LinkedIn profiles and secure interviews.");
  });
});
