import { describe, it, vi, expect } from "vitest"

import submitCommentaire from "./submitCommentaire"

describe("submitCommentaire", () => {
  it("By default, change current state if no error", async () => {
    // given
    const mockedSetSendingState = vi.fn()
    const mockedPostCommentaire = vi.fn()
    const repeatFunc = (x) => {
      return x
    }
    // when
    await submitCommentaire({ id: "aaaa", iv: "aaaa", comment: "Commentaire" }, mockedSetSendingState, mockedPostCommentaire, repeatFunc)
    // then
    expect(mockedPostCommentaire).toHaveBeenCalledWith({ id: "aaaa", iv: "aaaa", comment: "Commentaire" })
    expect(mockedSetSendingState).toHaveBeenCalledWith("currently_sending")
    expect(mockedSetSendingState).toHaveBeenCalledWith("ok_sent")
  })

  it.only("If error, change state with an error", async () => {
    // given
    const mockedSetSendingState = vi.fn()
    const badFunc = () => {
      throw "Just an error for testing purpose"
    }
    // when
    await submitCommentaire({ id: "aaaa", iv: "aaaa" }, mockedSetSendingState, badFunc)
    // then
    expect(mockedSetSendingState).toHaveBeenCalledWith("currently_sending")
    expect(mockedSetSendingState).toHaveBeenCalledWith("not_sent_because_of_errors")
  })
})
