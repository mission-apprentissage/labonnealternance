import React from "react"
import { render, screen } from "@testing-library/react"
import LbbCompanyDetail from "./LbbCompanyDetail"
import DisplayContextProvider from "../../context/DisplayContextProvider"

describe("LbbCompanyDetail", () => {
  it("Displays the LBB component", () => {
    // Given
    render(
      <DisplayContextProvider>
        <LbbCompanyDetail lbb={lbbWithoutEmail} />
      </DisplayContextProvider>
    )
    // When
    const knowMoreLbb = screen.getByTestId("lbb-component")
    // Then
    expect(knowMoreLbb).toHaveTextContent("Qu'est ce qu'une candidature spontanée")
  })

  let lbbWithoutEmail = {
    ideaType: "lbb",
    title: "DATA BUSINESS MARKETING",
    longTitle: null,
    id: null,
    contact: {
      email: "",
      phone: "",
    },
    place: {
      distance: 1.2,
      fullAddress: "56 RUE FRANCOIS BRUNEAU, 44000 NANTES",
      latitude: 47.2291,
      longitude: -1.5619,
      city: "NANTES",
      address: "56 RUE FRANCOIS BRUNEAU, 44000 NANTES",
    },
    company: {
      name: "DATA BUSINESS MARKETING",
      siret: "40400744500079",
      size: "0 salarié",
      socialNetwork: "",
      url: "",
    },
    diplomaLevel: null,
    diploma: null,
    cfd: null,
    rncpCode: null,
    rncpLabel: null,
    rncpEligibleApprentissage: null,
    period: null,
    capacity: null,
    createdAt: null,
    lastUpdateAt: null,
    onisepUrl: null,
    url: "https://labonneboite.pole-emploi.fr/40400744500079/details?rome_code=M1803&utm_medium=web&utm_source=api__emploi_store_dev&utm_campaign=api__emploi_store_dev__idea",
    job: null,
    romes: [
      {
        code: "M1803",
        label: "Direction des systèmes d'information",
      },
    ],
    nafs: [
      {
        code: "6201Z",
        label: "Programmation informatique",
      },
    ],
    training: null,
  }
})
