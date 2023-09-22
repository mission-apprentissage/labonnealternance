// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { Formik } from "formik"
import { noop } from "lodash/noop"
import React from "react"
import { describe, expect, it } from "vitest"

import { AutoCompleteField } from "./AutoCompleteField"

describe("AutoCompleteField", () => {
  it("Renders static image and text", () => {
    const { container } = render(
      <Formik>
        <AutoCompleteField
          items={[]}
          itemToStringFunction={noop}
          onSelectedItemChangeFunction={noop}
          compareItemFunction={noop}
          onInputValueChangeFunction={noop}
          name="jobField"
          placeholder="ex: plomberie"
        />
      </Formik>
    )

    expect(container.querySelector(".containerIdentity") != null).toBe(true)
  })
})
