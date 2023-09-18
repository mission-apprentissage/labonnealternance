import { describe, expect, it, vi } from "vitest";

import toggleCandidature from "./toggleCandidature"

describe("toggleCandidature", () => {
  it("By default, set the sending state do default, and reverse modal value", () => {
    // given
    const setSendingState = vi.fn()
    const setIsModalOpen = vi.fn()
    const isModalOpen = false
    // when
    toggleCandidature({ isModalOpen, setSendingState, setIsModalOpen })
    // then
    expect(setSendingState).toHaveBeenCalledWith("not_sent")
    expect(setIsModalOpen).toHaveBeenCalledWith(true)
  })

  it("When modal is activated...", () => {
    // given
    const setSendingState = vi.fn()
    const setIsModalOpen = vi.fn()
    const isModalOpen = true
    // when
    toggleCandidature({ isModalOpen, setSendingState, setIsModalOpen })
    // then
    expect(setSendingState).not.toHaveBeenCalled()
    expect(setIsModalOpen).toHaveBeenCalledWith(false)
  })
})
