// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest";

import CandidatureLbaSubmit from "./CandidatureLbaSubmit"

describe("CandidatureLbaSubmit", () => {
  it("By default renders nothing", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={""} />)
    expect(container.firstChild).toBe(null)
  })

  it("Renders a submit button by default", () => {
    render(<CandidatureLbaSubmit sendingState={"not_sent"} />)
    expect(screen.getByTestId("candidature-not-sent")).toBeTruthy()
  })

  it("Renders an spinner message if submission is pending", () => {
    render(<CandidatureLbaSubmit sendingState={"currently_sending"} />)
    expect(screen.getByTestId("candidature-currently-sending")).toBeTruthy()
  })

  it.skip("Renders an appropriate message if submission is over and OK", () => {
    render(<CandidatureLbaSubmit sendingState={"ok_sent"} />)
    expect(screen.getByTestId("candidature-submit-ok")).toBeTruthy()
  })

  it.skip("Renders an error message if submission is over and NOT OK", () => {
    render(<CandidatureLbaSubmit sendingState={"not_sent_because_of_errors"} />)
    expect(screen.getByTestId("candidature-submit-error")).toBeTruthy()
  })
})
