import { render } from "@testing-library/react"
import React from "react"
import CandidatureLbaSubmit from "./CandidatureLbaSubmit"

describe("CandidatureLbaSubmit", () => {
  it("By default renders nothing", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={""} />)
    expect(container.firstChild).toBe(null)
  })

  it("Renders a submit button by default", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={"not_sent"} />)
    expect(container.firstChild.getByTestId("candidature-not-sent")).toBeTruthy()
  })

  it("Renders an spinner message if submission is pending", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={"currently_sending"} />)
    expect(container.firstChild.getByTestId("candidature-currently-sending")).toBeTruthy()
  })

  it("Renders an appropriate message if submission is over and OK", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={"ok_sent"} />)
    expect(container.firstChild.getByTestId("candidature-submit-ok")).toBeTruthy()
  })

  it("Renders an error message if submission is over and NOT OK", () => {
    const { container } = render(<CandidatureLbaSubmit sendingState={"not_sent_because_of_errors"} />)
    expect(container.firstChild.getByTestId("candidature-submit-error")).toBeTruthy()
  })
})
