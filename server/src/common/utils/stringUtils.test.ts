import { describe, expect, it } from "vitest"

import { sanitizeTextField } from "./stringUtils"

describe("sanitizeTextField", () => {
  describe("Edge cases and null handling", () => {
    it("should return empty string for null input", () => {
      expect(sanitizeTextField(null)).toBe("")
    })

    it("should return empty string for undefined input", () => {
      expect(sanitizeTextField(undefined)).toBe("")
    })

    it("should return empty string for empty string", () => {
      expect(sanitizeTextField("")).toBe("")
    })

    it("should trim whitespace", () => {
      expect(sanitizeTextField("  test  ", false)).toBe("test")
      expect(sanitizeTextField("\n\t test \n\t", false)).toBe("test")
    })
  })

  describe("Plain text handling (keepFormat = false)", () => {
    it("should preserve plain text without special characters", () => {
      expect(sanitizeTextField("This is plain text.", false)).toBe("This is plain text.")
    })

    it("should escape literal < > & characters for safe HTML display", () => {
      expect(sanitizeTextField("5 < 10 & 3 > 1", false)).toBe("5 &lt; 10 &amp; 3 &gt; 1")
    })

    it("should handle multiple special characters in sequence", () => {
      expect(sanitizeTextField("<>&<>&", false)).toBe("&lt;&gt;&amp;&lt;&gt;&amp;")
    })

    it("should preserve other special characters like quotes", () => {
      expect(sanitizeTextField("Text with \"quotes\" and 'apostrophes'", false)).toBe("Text with \"quotes\" and 'apostrophes'")
    })
  })

  describe("HTML entity decoding and encoding", () => {
    it("should decode single-encoded entities before sanitizing", () => {
      // Input: &lt;script&gt; -> decodes to: <script> -> sanitized to: (removed)
      expect(sanitizeTextField("&lt;script&gt;alert(1)&lt;/script&gt;", false)).toBe("")
    })

    it("should decode double-encoded entities once and keep safe", () => {
      // Input: &amp;lt;script&amp;gt; -> decodes to: &lt;script&gt; -> stays as &lt;script&gt; (safe)
      expect(sanitizeTextField("&amp;lt;script&amp;gt;", false)).toBe("&lt;script&gt;")
    })

    it("should preserve already-encoded entities in output", () => {
      // Already encoded & should stay encoded for safe display
      expect(sanitizeTextField("Price &amp; Tax", false)).toBe("Price &amp; Tax")
      expect(sanitizeTextField("A &lt; B", false)).toBe("A &lt; B")
      expect(sanitizeTextField("A &gt; B", false)).toBe("A &gt; B")
    })

    it("should handle mixed literal and encoded entities", () => {
      // Mix of < (literal) and &lt; (encoded)
      expect(sanitizeTextField("Text < and &lt; both", false)).toBe("Text &lt; and &lt; both")
    })

    it("should handle triple-encoded entities correctly", () => {
      // &amp;amp;lt; -> decodes once to: &amp;lt; -> stays safe
      expect(sanitizeTextField("&amp;amp;lt;script&amp;amp;gt;", false)).toBe("&amp;lt;script&amp;gt;")
    })

    it("should decode common entities correctly", () => {
      // &nbsp; becomes non-breaking space, but gets trimmed
      expect(sanitizeTextField("&nbsp;&copy;&reg;", false)).toBe("©®")
      expect(sanitizeTextField("Test&nbsp;&copy;", false)).toBe("Test\u00A0©")
    })
  })

  describe("XSS attack vectors (keepFormat = false)", () => {
    const xssVectors = [
      { name: "basic script tag", input: "<script>alert(1)</script>", expected: "" },
      { name: "script with attributes", input: '<script type="text/javascript">alert(1)</script>', expected: "" },
      { name: "IMG with javascript", input: "<IMG SRC='javascript:alert(1)'>", expected: "" },
      { name: "IMG with case variation", input: "<IMG SRC=JaVaScRiPt:alert(1)>", expected: "" },
      { name: "IMG with charcode", input: "<IMG SRC=javascript:alert(String.fromCharCode(88,83,83))>", expected: "" },
      { name: "anchor with javascript", input: '<a href="javascript:alert(1)">xss</a>', expected: "xss" },
      { name: "body onload", input: "<BODY ONLOAD=alert(1)>", expected: "" },
      { name: "iframe with javascript", input: '<iframe src="javascript:alert(1)">', expected: "" },
      { name: "div with style javascript", input: '<div style="background-image: url(javascript:alert(1))">', expected: "" },
      { name: "div with expression", input: '<div style="width: expression(alert(1));">', expected: "" },
      { name: "div with event handler", input: '<div onmouseover="alert(1)">Hover</div>', expected: "Hover" },
      { name: "SVG with script", input: "<svg><script>alert(1)</script></svg>", expected: "" },
      { name: "math with xlink", input: '<math><mi xlink:href="data:x,<script>alert(1)</script>">X</mi></math>', expected: "X" },
      { name: "link tag", input: '<link rel="stylesheet" href="javascript:alert(1)">', expected: "" },
      { name: "meta refresh", input: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">', expected: "" },
      { name: "object tag", input: '<object data="javascript:alert(1)">', expected: "" },
      { name: "embed tag", input: '<embed src="javascript:alert(1)">', expected: "" },
    ]

    xssVectors.forEach(({ name, input, expected }) => {
      it(`should block XSS: ${name}`, () => {
        expect(sanitizeTextField(input, false)).toBe(expected)
      })
    })
  })

  describe("XSS attack vectors with encoding tricks", () => {
    it("should block encoded script tags", () => {
      expect(sanitizeTextField("&lt;script&gt;alert(1)&lt;/script&gt;", false)).toBe("")
    })

    it("should block double-encoded dangerous tags", () => {
      const result = sanitizeTextField("&amp;lt;img src=x onerror=alert(1)&amp;gt;", false)
      expect(result).toBe("&lt;img src=x onerror=alert(1)&gt;")
      expect(result).not.toContain("<img")
    })

    it("should not allow script injection via mixed encoding", () => {
      // Mix of literal and encoded
      expect(sanitizeTextField("<scr&lt;ipt&gt;alert(1)</script>", false)).not.toContain("<script")
    })
  })

  describe("HTML formatting with keepFormat = true", () => {
    it("should preserve allowed HTML tags", () => {
      const input = "<p><strong>Test</strong> <em>allowed</em></p><ul><li>Item</li></ul>"
      expect(sanitizeTextField(input, true)).toBe(input)
    })

    it("should preserve <b> and <i> tags", () => {
      expect(sanitizeTextField("<b>bold</b> and <i>italic</i>", true)).toBe("<b>bold</b> and <i>italic</i>")
    })

    it("should preserve <br> tags", () => {
      // sanitizeHtml normalizes <br> to <br />
      expect(sanitizeTextField("Line 1<br>Line 2<br>Line 3", true)).toBe("Line 1<br />Line 2<br />Line 3")
    })

    it("should remove dangerous tags but keep allowed ones", () => {
      const input = "<p>Safe <strong>content</strong></p><script>alert(1)</script>"
      expect(sanitizeTextField(input, true)).toBe("<p>Safe <strong>content</strong></p>")
    })

    it("should remove all tags when keepFormat = false", () => {
      const input = "<p><strong>Test</strong> <em>allowed</em></p><ul><li>Item</li></ul>"
      // Whitespace between tags gets collapsed
      expect(sanitizeTextField(input, false)).toBe("Test allowedItem")
    })

    it("should escape special chars even with keepFormat = true", () => {
      // Special chars outside tags should still be escaped
      expect(sanitizeTextField("<p>5 < 10 & 3 > 1</p>", true)).toBe("<p>5 &lt; 10 &amp; 3 &gt; 1</p>")
    })

    it("should remove disallowed attributes from allowed tags", () => {
      const input = '<p onclick="alert(1)" style="color:red">Text</p>'
      expect(sanitizeTextField(input, true)).toBe("<p>Text</p>")
    })
  })

  describe("Complex mixed content scenarios", () => {
    it("should handle mix of text, safe HTML, and dangerous HTML", () => {
      const input = "Normal text <script>alert(1)</script> and 5 < 10 with <strong>bold</strong>"
      const resultNoFormat = sanitizeTextField(input, false)
      const resultWithFormat = sanitizeTextField(input, true)

      expect(resultNoFormat).toBe("Normal text  and 5 &lt; 10 with bold")
      expect(resultWithFormat).toBe("Normal text  and 5 &lt; 10 with <strong>bold</strong>")
    })

    it("should handle nested allowed tags", () => {
      const input = "<p><strong><em>nested</em></strong></p>"
      expect(sanitizeTextField(input, true)).toBe(input)
    })

    it("should handle malformed HTML gracefully", () => {
      expect(sanitizeTextField("<p>Unclosed paragraph", true)).toBe("<p>Unclosed paragraph</p>")
      expect(sanitizeTextField("<strong>Unclosed <em>tags", true)).toBe("<strong>Unclosed <em>tags</em></strong>")
    })

    it("should handle empty tags", () => {
      expect(sanitizeTextField("<p></p><strong></strong>", true)).toBe("<p></p><strong></strong>")
    })

    it("should handle tags with only whitespace", () => {
      expect(sanitizeTextField("<p>   </p>", true)).toBe("<p>   </p>")
    })
  })

  describe("HTML safety verification", () => {
    it("should output safe HTML entities (no unescaped < > for non-allowed tags)", () => {
      const testCases = [
        sanitizeTextField("<script>alert(1)</script>", false),
        sanitizeTextField("User input: < > &", false),
        sanitizeTextField("<img src=x onerror=alert(1)>", false),
        sanitizeTextField("Mix of <div>html</div> and < text", false),
      ]

      testCases.forEach((output) => {
        // Verify no dangerous unescaped < or > exist (except as part of entities like &lt;)
        const hasUnsafeTags = /<(?!\/?(b|i|em|strong|p|br|ul|li)[\s>])/.test(output) || /(?<!&[a-z]{2})>/.test(output)
        expect(hasUnsafeTags).toBe(false)
      })
    })

    it("should ensure output is safe for dangerouslySetInnerHTML", () => {
      const dangerous = "<img src=x onerror=alert(1)><script>alert(1)</script>"
      const result = sanitizeTextField(dangerous, false)

      // Result should not contain executable HTML
      expect(result).not.toContain("<img")
      expect(result).not.toContain("<script")
      expect(result).not.toContain("onerror")
    })
  })

  describe("Real-world scenarios", () => {
    it("should handle typical user bio with line breaks", () => {
      const bio = "Hello!<br>I am a developer.<br>Contact me."
      // sanitizeHtml normalizes <br> to <br />
      expect(sanitizeTextField(bio, true)).toBe("Hello!<br />I am a developer.<br />Contact me.")
    })

    it("should handle job description with formatting", () => {
      const description = "<p>We are looking for:</p><ul><li>Developers</li><li>Designers</li></ul>"
      expect(sanitizeTextField(description, true)).toBe(description)
    })

    it("should handle user input with accidental HTML", () => {
      const userInput = "My salary expectation is 50k < 60k & benefits"
      expect(sanitizeTextField(userInput, false)).toBe("My salary expectation is 50k &lt; 60k &amp; benefits")
    })

    it("should handle copied content from web (with entities)", () => {
      const copied = "This &amp; that, cost &lt; $100"
      expect(sanitizeTextField(copied, false)).toBe("This &amp; that, cost &lt; $100")
    })

    it("should handle French characters and accents", () => {
      const french = "Café à Paris, c'est génial!"
      expect(sanitizeTextField(french, false)).toBe(french)
    })

    it("should handle numbers and special notation", () => {
      expect(sanitizeTextField("1 + 1 = 2", false)).toBe("1 + 1 = 2")
      expect(sanitizeTextField("x² + y² = z²", false)).toBe("x² + y² = z²")
    })
  })
})
