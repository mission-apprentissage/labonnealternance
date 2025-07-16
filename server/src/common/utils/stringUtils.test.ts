import { describe, expect, it } from "vitest"

import { sanitizeTextField } from "@/common/utils/stringUtils"

const allowedHtml = "<p><strong>Test</strong> <em>allowed</em> </p><ul><li>Item</li></ul>"
const plainText = "This is a plain text."

const xssVectors = [
  { input: "<script>alert(1)</script>", expected: "" },
  { input: "<IMG SRC='javascript:alert('XSS');'>", expected: "" },
  { input: "<IMG SRC=JaVaScRiPt:alert(1)>", expected: "" },
  { input: "<IMG SRC=javascript:alert(String.fromCharCode(88,83,83))>", expected: "" },
  { input: "<IMG SRC=`javascript:alert('RSnake says, 'XSS'')`>", expected: "" },
  { input: '<a href="javascript:alert(1)">xss</a>', expected: "xss" },
  { input: "<BODY ONLOAD=alert(1)>", expected: "" },
  { input: '<iframe src="javascript:alert(1)">', expected: "" },
  { input: '<div style="background-image: url(javascript:alert(1))">', expected: "" },
  { input: '<div style="width: expression(alert(1));">', expected: "" },
  { input: '<div onmouseover="alert(1)">Hover me!</div>', expected: "Hover me!" },
  { input: '<math><mi xlink:href="data:x,<script>alert(1)</script>">X</mi></math>', expected: "X" },
  { input: "<svg><script>alert(1)</script></svg>", expected: "" },
  { input: '<link rel="stylesheet" href="javascript:alert(1)">', expected: "" },
  { input: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">', expected: "" },
  { input: '<object data="javascript:alert(1)">', expected: "" },
  { input: '<embed src="javascript:alert(1)">', expected: "" },
]

describe("sanitizeTextField", () => {
  describe("With keepFormat = true", () => {
    it("should keep allowed HTML tags and remove others", () => {
      expect(sanitizeTextField(allowedHtml, true)).toBe(allowedHtml)
    })

    it("should return plain text unchanged", () => {
      expect(sanitizeTextField(plainText, true)).toBe(plainText)
    })

    xssVectors.forEach(({ input, expected }, idx) => {
      it(`should sanitize XSS vector #${idx + 1}`, () => {
        expect(sanitizeTextField(input, true)).toBe(expected)
      })
    })
  })

  describe("With keepFormat = false", () => {
    it("should remove all HTML and return plain text", () => {
      expect(sanitizeTextField(allowedHtml, false)).toBe("Test allowed Item")
    })

    it("should return plain text unchanged", () => {
      expect(sanitizeTextField(plainText, false)).toBe(plainText)
    })

    xssVectors.forEach(({ input, expected }, idx) => {
      it(`should sanitize XSS vector #${idx + 1} with no allowed tags`, () => {
        expect(sanitizeTextField(input, false)).toBe(expected)
      })
    })
  })

  it("should handle null and undefined inputs", () => {
    expect(sanitizeTextField(null)).toBe("")
    expect(sanitizeTextField(undefined)).toBe("")
  })

  it("should decode HTML entities before sanitizing", () => {
    expect(sanitizeTextField("&lt;script&gt;alert(1)&lt;/script&gt;", false)).toBe("")
  })
})
