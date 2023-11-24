import { describe, expect, expectTypeOf, it } from "vitest"

import { apiGet, generateUrl } from "./api.utils"

describe("generateUrl", () => {
  it("should generate correct url", () => {
    expect(
      generateUrl("/courses/:id", {
        params: { id: "routing" },
        querystring: { a: "hello", b: "world" },
      })
    ).toBe("http://localhost:5000/api/courses/routing?a=hello&b=world")
  })
})

describe("typing route definition: no header + access token", () => {
  describe("no header + access token", () => {
    it("should not detect an error", () => {
      expectTypeOf(
        apiGet(`/optout/validate`, {
          headers: {
            authorization: `Bearer fakeToken`,
          },
        })
      ).resolves.not.toBeAny()
    })
    it("should detect a misspelled header", () => {
      expectTypeOf(
        apiGet(`/optout/validate`, {
          headers: {
            // @ts-expect-error should detect invalid key "Authorization"
            Authorization: `Bearer fakeToken`,
          },
        })
      ).resolves.not.toBeAny()
    })
    it("should detect a missing header", () => {
      expectTypeOf(
        apiGet(`/optout/validate`, {
          // @ts-expect-error should detect missing key "authorization"
          headers: {},
        })
      ).resolves.not.toBeAny()
    })
    it("should detect an unexpected header", () => {
      expectTypeOf(
        apiGet(`/optout/validate`, {
          headers: {
            authorization: `Bearer fakeToken`,
            // @ts-expect-error should detect header is not defined in the route
            test: "test",
          },
        })
      ).resolves.not.toBeAny()
    })
  })
})
