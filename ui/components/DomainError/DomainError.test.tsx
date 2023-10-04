// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, it, expect } from "vitest"

import DomainError from "./DomainError"

describe("DomainError", () => {
  it("Renders static image and text", () => {
    // @ts-expect-error: TODO
    render(<DomainError />)
    expect(screen.getByTestId("domainError")).not.toBe(null)
  })
})
