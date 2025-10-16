import { assertTrue } from "./assertTrue"

export const containsText = (text: string, content: string) => {
  assertTrue(content.includes(text), `could not find text "${text}" in ${content}`)
}
