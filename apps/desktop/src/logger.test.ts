import { describe, expect, it } from "vitest";
import { redact } from "./logger";

describe("diagnostic redaction", () => {
  it("redacts secret fields and bearer/key patterns recursively", () => {
    const keyLikeFixture = ["sk", "anothersecret123456"].join("-");
    const secretFieldFixture = ["sk", "example", "secret", "value"].join("-");
    const result = redact({
      apiKey: secretFieldFixture,
      nested: { authorization: "Bearer abc.def.ghi", note: `token ${keyLikeFixture}` }
    });
    expect(JSON.stringify(result)).not.toContain("example-secret");
    expect(JSON.stringify(result)).not.toContain("abc.def.ghi");
    expect(result).toEqual({
      apiKey: "[REDACTED]",
      nested: { authorization: "[REDACTED]", note: "token [REDACTED_KEY]" }
    });
  });
});
