import { describe, expect, it, vi } from "vitest";

import submitCandidature from "./submitCandidature"

describe("submitCandidature", () => {
  it("By default, change current state if no error", async () => {
    // given
    const mockedSetSendingState = vi.fn()
    const mockedPostCandidature = vi.fn(() => {
      return "ok"
    })
    const repeatFunc = (x) => {
      return x
    }
    // when
    await submitCandidature({ applicantValues: { applicants: "values" }, setSendingState: mockedSetSendingState, item: { items: "some" } }, mockedPostCandidature, repeatFunc)
    // then
    expect(mockedPostCandidature).toHaveBeenCalledWith({ applicants: "values" }, { items: "some" }, null)
    expect(mockedSetSendingState).toHaveBeenCalledWith("currently_sending")
    expect(mockedSetSendingState).toHaveBeenCalledWith("ok_sent")
  })

  it("If error, change state with an error", async () => {
    // given
    const mockedSetSendingState = vi.fn()
    const emptyFunc = () => {}
    const mockedPostCandidature = vi.fn(() => {
      throw "Custom error"
    })
    // when
    await submitCandidature({ applicantValues: null, setSendingState: mockedSetSendingState, item: {} }, mockedPostCandidature, emptyFunc)
    // then
    expect(mockedSetSendingState).toHaveBeenCalledWith("currently_sending")
    expect(mockedSetSendingState).toHaveBeenCalledWith("not_sent_because_of_errors")
  })

  it("If post result error, change state with an error", async () => {
    // given
    const mockedSetSendingState = vi.fn()
    const mockedPostCandidature = vi.fn(() => {
      return "error"
    })
    const repeatFunc = (x) => {
      return x
    }
    // when
    await submitCandidature({ applicantValues: { applicants: "values" }, setSendingState: mockedSetSendingState, item: { items: "some" } }, mockedPostCandidature, repeatFunc)
    // then
    expect(mockedPostCandidature).toHaveBeenCalledWith({ applicants: "values" }, { items: "some" }, null)
    expect(mockedSetSendingState).toHaveBeenCalledWith("currently_sending")
    expect(mockedSetSendingState).toHaveBeenCalledWith("error")
  })
})
