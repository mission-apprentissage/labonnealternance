import React from "react"
import { render, screen, fireEvent, wait, waitFor } from "@testing-library/react"
import ResultLists from "./ResultLists"
import nock from "nock"

describe("ResultList", () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  it("By default displays a result list", () => {
    // Given /When
    render(
      <ResultLists
        setActiveFilter={() => {}}
        selectedItem={null}
        handleSelectItem={() => {}}
        showSearchForm={() => {}}
        isTrainingSearchLoading={false}
        isJobSearchLoading={false}
        handleExtendedSearch={() => {}}
        searchForJobsOnNewCenter={() => {}}
        searchForTrainingsOnNewCenter={() => {}}
        jobSearchError={""}
        allJobSearchError={false}
        trainingSearchError={""}
        shouldShowWelcomeMessage={false}
        isTestMode={true}
        stubbedExtendedSearch={false}
        stubbedHasSearch={true}
        stubbedIsFormVisible={true}
        activeFilter={"all"}
        searchRadius={10}
        trainings={realisticFormations}
        jobs={{
          peJobs: [],
          matchas: [],
          lbbCompanies: realisticLbbCompanies,
        }}
      />
    )
    // Then
    expect(screen.getByTestId("LbbCompany-uco")).not.toBeNull()
    expect(screen.getByTestId("Training-ingediplo")).not.toBeNull()
  })

  let realisticFormations = [
    {
      ideaType: "formation",
      title: "INGENIEUR DIPLOME",
      longTitle: "INGENIEUR DIPLOME",
      id: "ingediplo",
      place: {
        distance: 29.445828444412832,
        fullAddress: "6 rue de Kérampont BP 80518 22300 Lannion",
        latitude: "48.7294471",
        longitude: "-3.4623017",
        city: "Lannion",
        address: "6 rue de Kérampont BP 80518",
        cedex: "22305",
        zipCode: "22300",
        departementNumber: "22",
        region: "Bretagne",
        insee: "22113",
      },
      company: {
        name: "UNIVERSITE DE RENNES I",
        siret: "19350936100278",
        id: "5e8df90d20ff3b2161268530",
        headquarter: {
          id: "5e8df8b820ff3b2161267e34",
          type: "CFA",
          hasConvention: "NON",
          place: { address: "6 RUE KLEBER", cedex: "35065", zipCode: "35000", city: "RENNES" },
          name: "UNIVERSITE DE RENNES I",
        },
        place: { city: "LANNION" },
      },
      diplomaLevel: "7 (Master, titre ingénieur...)",
      diploma: "INGENIEURS RECONNUS (RCT..), NFI , ALTERNANCE",
      cfd: "1703260V",
      rncpCode: "RNCP35781",
      rncpLabel: "Ingénieur de l'école nationale supérieure des sciences appliquées et de technologie, spécialité informatique et technologies de l'information",
      rncpEligibleApprentissage: true,
      period: '["2021-09"]',
      createdAt: "2021-08-08T00:10:47.074Z",
      lastUpdateAt: "2021-11-09T03:29:47.594Z",
      romes: [{ code: "M1804" }, { code: "M1802" }, { code: "M1805" }, { code: "M1806" }],
      idRco: "06_2000241F",
      idRcoFormation: "06_2000241F|06_1254822|66191",
    },
  ]
  let realisticLbbCompanies = [
    {
      ideaType: "lbb",
      title: "UCO BRETAGNE NORD",
      id: "uco",
      contact: { email: "dc0978c88ea56663fee248f0283113", iv: "0531f1663e97c92b58572bd5d9203bbe", phone: "0296444646" },
      place: {
        distance: 0.7,
        fullAddress: "Service des ressources humaines, 37 RUE DU MARECHAL FOCH, 22200 GUINGAMP",
        latitude: 48.5618,
        longitude: -3.16289,
        city: "GUINGAMP",
        address: "Service des ressources humaines, 37 RUE DU MARECHAL FOCH, 22200 GUINGAMP",
      },
      company: {
        name: "UCO BRETAGNE NORD",
        siret: "39326123500013",
        size: "50 à 99 salariés",
        socialNetwork: "",
        url: "",
      },
      url: "https://labonneboite.pole-emploi.fr/39326123500013/details?rome_code=M1805&utm_medium=web&utm_source=api__emploi_store_dev&utm_campaign=api__emploi_store_dev__idea",
      romes: [{ code: "M1805", label: "Études et développement informatique" }],
      nafs: [{ code: "8542Z", label: "Enseignement supérieur" }],
    },
  ]
})
