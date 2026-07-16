import { resolveCheckoutApiBase } from "../components/PricingCheckoutButton";

describe("resolveCheckoutApiBase", () => {
  it("prefers the local backend when running on localhost even if a production API URL is configured", () => {
    expect(
      resolveCheckoutApiBase({
        hostname: "localhost",
        configuredApiUrl: "https://9jobs.co",
      })
    ).toBe("http://localhost:5000");
  });

  it("uses a local configured API URL when one is provided for localhost", () => {
    expect(
      resolveCheckoutApiBase({
        hostname: "localhost",
        configuredApiUrl: "http://127.0.0.1:5000/",
      })
    ).toBe("http://127.0.0.1:5000");
  });

  it("uses a relative API path outside localhost", () => {
    expect(
      resolveCheckoutApiBase({
        hostname: "9jobs.co",
        configuredApiUrl: "https://9jobs.co",
      })
    ).toBe("");
  });
});
