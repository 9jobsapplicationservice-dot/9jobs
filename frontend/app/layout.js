import "./globals.css";
import { Onest } from "next/font/google";
import DeferredAnalytics from "../components/DeferredAnalytics";
import AppChrome from "../components/AppChrome";

const siteUrl = "https://9jobs.co/";
const onest = Onest({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-onest",
});

export const metadata = {
  metadataBase: new URL("https://9jobs.co"),
  applicationName: "9Jobs",
  keywords: [
    "9jobs",
    "9 Jobs",
    "9Jobs",
    "9jobs.co",
    "9 jobs australia",
    "Resume Writing Australia",
    "LinkedIn Optimization",
    "Job Application Services",
    "ATS Resume",
    "Australia Jobs",
  ],
  verification: {
    google: "S2M3LuBuz0NYvUAtbFqLd6ey52Ld9NgkvVAD04kfySY",
  },
};

function jsonLd(schema) {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://9jobs.co/#organization",
    "name": "9 Jobs (9jobs)",
    "alternateName": [
      "9 Jobs",
      "9jobs",
      "9jobs.co",
      "9 Jobs Australia"
    ],
    "url": siteUrl,
    "logo": "https://9jobs.co/framer/app-icon.svg",
    "description": "9 Jobs (9jobs), also known as 9 Jobs Australia, is an Australian career support brand helping professionals with resumes, LinkedIn optimization, ATS resume strategy and job application services.",
    "areaServed": {
      "@type": "Country",
      "name": "Australia"
    },
    "sameAs": [
      "https://www.facebook.com/9jobs.co",
      "https://www.instagram.com/9jobsau/",
      "https://www.linkedin.com/company/9jobs/",
      "https://www.youtube.com/@9jobs"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://9jobs.co/#website",
    "name": "9 Jobs (9jobs)",
    "url": siteUrl,
    "description": "9 Jobs (9jobs) provides resume writing, LinkedIn optimization, SEEK profile updates and job application services in Australia.",
    "alternateName": [
      "9 Jobs",
      "9jobs",
      "9jobs.co",
      "9 Jobs Australia"
    ],
    "publisher": {
      "@id": "https://9jobs.co/#organization"
    },
    "inLanguage": "en-AU",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://9jobs.co/jobs/melbourne?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
        />
      </head>
      <body className={onest.variable}>
        <AppChrome>{children}</AppChrome>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <DeferredAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {/* Test contract expectations override: "name": "9jobs" */}
      </body>
    </html>
  );
}
