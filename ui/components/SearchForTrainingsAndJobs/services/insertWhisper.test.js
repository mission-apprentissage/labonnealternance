// @vitest-environment jsdom

import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { insertWhisper } from "./whispers"

describe("insertWhisper", () => {
  it("insertWhisper() : do not insert anything if data are loading", async () => {
    document.body.innerHTML = "<div>" + '  <span class="whisper">Im a whisper</span>' + "</div>"
    let res = await insertWhisper(document, true)
    expect(res).toEqual("loading data : no change")
  })

  it.skip("insertWhisper() : do not insert anything if whisper already here", async () => {
    document.body.innerHTML = "<div>" + '  <span class="whisper">Im a whisper</span>' + "</div>"
    let res = await insertWhisper(document)
    expect(res).toEqual("whisper already exists : no change")
  })

  it("insertWhisper() : do not insert anything if there is no resultCard", async () => {
    document.body.innerHTML = "<div>" + "  Empty div, empty document" + "</div>"
    let res = await insertWhisper(document)
    expect(res).toEqual("no resultCard found")
  })

  it("insertWhisper() : insert a whisper if more than 9 resultCard", async () => {
    document.body.innerHTML =
      '<div id="app">' +
      '  <span class="resultCard">1</span>' +
      '  <span class="resultCard">2</span>' +
      '  <span class="resultCard">3</span>' +
      '  <span class="resultCard">4</span>' +
      '  <span class="resultCard">5</span>' +
      '  <span class="resultCard">6</span>' +
      '  <span class="resultCard">7</span>' +
      '  <span class="resultCard">8</span>' +
      '  <span class="resultCard">9</span>' +
      '  <span class="resultCard">10</span>' +
      "</div>"
    let res = await insertWhisper(document)
    const whisper = screen.queryByTestId("whisper0")
    expect(whisper).not.toBeNull()
    expect(res).toEqual("whisper randomly inserted")
  })
})
