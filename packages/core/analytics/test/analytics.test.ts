import { describe, it, expect } from "vitest";
import { GA4AdminClient } from "../src/index.js";

describe("@gatriever/core: GA4AdminClient", () => {
  it("should format filter name and display name correctly", () => {
    const client = new GA4AdminClient(
      JSON.stringify({ client_email: "test@example.com", private_key: "fake-key" })
    );

    const displayName = client.generateFilterDisplayName("Home (Tenet)", "home-tenet");
    expect(displayName).toBe("gatriever: Home (Tenet) (home-tenet)");
  });
});
