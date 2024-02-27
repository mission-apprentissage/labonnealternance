import assert from "assert"

export const containsText = (text: string, content: string) => {
  assert.ok(content.includes(text), `could not find text "${text}" in ${content}`)
}
