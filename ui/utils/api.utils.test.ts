import { describe, expect, it } from "vitest";

import { generatePath, generateQueryString, generateUrl } from "./api.utils";

/*
 * The following tests are inspired from https://github.com/remix-run/react-router/blob/868e5157bbb72fb77f827f264a2b7f6f6106147d/packages/react-router/__tests__/generatePath-test.tsx#L3C1-L182
 *
 * MIT License
 *
 * Copyright (c) React Training LLC 2015-2019
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2023
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
describe("generatePath", () => {
  describe("with no params", () => {
    it("returns the unmodified path", () => {
      expect(generatePath("/")).toBe("/");
      expect(generatePath("/courses")).toBe("/courses");
    });
  });

  describe("with params", () => {
    it("returns the path without those params interpolated", () => {
      expect(generatePath("/courses/:id", { id: "routing" })).toBe("/courses/routing");
      expect(
        generatePath("/courses/:id/student/:studentId", {
          id: "routing",
          studentId: "matt",
        })
      ).toBe("/courses/routing/student/matt");
      expect(generatePath("/courses/*", { "*": "routing/grades" })).toBe("/courses/routing/grades");
      expect(generatePath("*", { "*": "routing/grades" })).toBe("routing/grades");
      expect(generatePath("/*", {})).toBe("/");
    });
    it("handles * in parameter values", () => {
      expect(generatePath("/courses/:name", { name: "foo*" })).toBe("/courses/foo*");
      expect(generatePath("/courses/:name", { name: "*foo" })).toBe("/courses/*foo");
      expect(generatePath("/courses/:name", { name: "*f*oo*" })).toBe("/courses/*f*oo*");
      expect(
        generatePath("/courses/:name", {
          name: "foo*",
          "*": "splat_should_not_be_added",
        })
      ).toBe("/courses/foo*");
    });
    it("handles a 0 parameter", () => {
      // @ts-expect-error
      // incorrect usage but worked in 6.3.0 so keep it to avoid the regression
      expect(generatePath("/courses/:id", { id: 0 })).toBe("/courses/0");
      // @ts-expect-error
      // incorrect usage but worked in 6.3.0 so keep it to avoid the regression
      expect(generatePath("/courses/*", { "*": 0 })).toBe("/courses/0");
    });
  });

  describe("with extraneous params", () => {
    it("ignores them", () => {
      expect(generatePath("/", { course: "routing" })).toBe("/");
      expect(generatePath("/courses", { course: "routing" })).toBe("/courses");
    });
  });

  describe("with missing params", () => {
    it("throws an error", () => {
      expect(() => {
        generatePath("/:lang/login", {});
      }).toThrow(/Missing ":lang" param/);
    });
  });

  describe("with a missing splat", () => {
    it("omits the splat and trims the trailing slash", () => {
      expect(generatePath("/courses/*", {})).toBe("/courses");
    });
  });

  describe("with optional params", () => {
    it("adds optional dynamic params where appropriate", () => {
      const path = "/:one?/:two?/:three?";
      expect(generatePath(path, { one: "uno" })).toBe("/uno");
      expect(generatePath(path, { one: "uno", two: "dos" })).toBe("/uno/dos");
      expect(
        generatePath(path, {
          one: "uno",
          two: "dos",
          three: "tres",
        })
      ).toBe("/uno/dos/tres");
      expect(generatePath(path, { one: "uno", three: "tres" })).toBe("/uno/tres");
      expect(generatePath(path, { two: "dos" })).toBe("/dos");
      expect(generatePath(path, { two: "dos", three: "tres" })).toBe("/dos/tres");
    });

    it("strips optional aspects of static segments", () => {
      expect(generatePath("/one?/two?/:three?", {})).toBe("/one/two");
      expect(generatePath("/one?/two?/:three?", { three: "tres" })).toBe("/one/two/tres");
    });

    it("handles intermixed segments", () => {
      const path = "/one?/:two?/three/:four/*";
      expect(generatePath(path, { four: "cuatro" })).toBe("/one/three/cuatro");
      expect(
        generatePath(path, {
          two: "dos",
          four: "cuatro",
        })
      ).toBe("/one/dos/three/cuatro");
      expect(
        generatePath(path, {
          two: "dos",
          four: "cuatro",
          "*": "splat",
        })
      ).toBe("/one/dos/three/cuatro/splat");
      expect(
        generatePath(path, {
          two: "dos",
          four: "cuatro",
          "*": "splat/and/then/some",
        })
      ).toBe("/one/dos/three/cuatro/splat/and/then/some");
    });
  });

  it("throws only on on missing named parameters, but not missing splat params", () => {
    expect(() => generatePath(":foo")).toThrow();
    expect(() => generatePath("/:foo")).toThrow();
    expect(() => generatePath("*")).not.toThrow();
    expect(() => generatePath("/*")).not.toThrow();
  });

  it("only interpolates and does not add slashes", () => {
    expect(generatePath("*")).toBe("");
    expect(generatePath("/*")).toBe("/");

    expect(generatePath("foo*")).toBe("foo");
    expect(generatePath("/foo*")).toBe("/foo");

    expect(generatePath(":foo", { foo: "bar" })).toBe("bar");
    expect(generatePath("/:foo", { foo: "bar" })).toBe("/bar");

    expect(generatePath("*", { "*": "bar" })).toBe("bar");
    expect(generatePath("/*", { "*": "bar" })).toBe("/bar");

    // No support for partial dynamic params
    expect(generatePath("foo:bar", { bar: "baz" })).toBe("foo:bar");
    expect(generatePath("/foo:bar", { bar: "baz" })).toBe("/foo:bar");

    // Partial splats are treated as independent path segments
    expect(generatePath("foo*", { "*": "bar" })).toBe("foo/bar");
    expect(generatePath("/foo*", { "*": "bar" })).toBe("/foo/bar");
  });
});

describe("generateQueryString", () => {
  describe("with no params", () => {
    it("returns empty search params", () => {
      expect(generateQueryString()).toBe("?");
    });
  });
  describe("with string params", () => {
    it("returns corresponding search params", () => {
      expect(generateQueryString({ a: "hello", b: "world" })).toBe("?a=hello&b=world");
    });
  });
  describe("with array string params", () => {
    it("returns corresponding search params", () => {
      expect(generateQueryString({ a: ["hello", "world"] })).toBe("?a=hello&a=world");
    });
  });
});

describe("generateUrl", () => {
  it("should generate correct url", () => {
    expect(
      generateUrl("/courses/:id", {
        params: { id: "routing" },
        querystring: { a: "hello", b: "world" },
      })
    ).toBe("http://localhost:5000/api/courses/routing?a=hello&b=world");
  });
});
