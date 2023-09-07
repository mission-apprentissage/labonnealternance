import { render } from "@testing-library/react"
import React from "react"

import DomainError from "./DomainError"

describe("DomainError", () => {
  it("Renders static image and text", () => {
    const { container } = render(<DomainError />)
    expect(container.firstChild.getByTestId("domainError").toBeInTheDocument())
  })
})
