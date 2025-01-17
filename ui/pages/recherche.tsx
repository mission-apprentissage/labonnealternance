import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import React, { useEffect } from "react"

import SearchForTrainingsAndJobs from "../components/SearchForTrainingsAndJobs"
import { ParameterContext } from "../context/ParameterContextProvider"
import { ScopeContextProvider } from "../context/ScopeContext"
import { initParametersFromQuery } from "../services/config"
import { getSeoDescription, getSeoTitle } from "../utils/seoUtils"

const RechercheApprentissage = () => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, parameterContext })
  }, [])

  return (
    <>
      <NextSeo title={getSeoTitle({ parameterContext, page: "Offres" })} description={getSeoDescription({ parameterContext, page: "Offres" })} />
      <ScopeContextProvider value={{ isJob: true, isTraining: true, path: "/recherche" }}>
        <SearchForTrainingsAndJobs />
      </ScopeContextProvider>
    </>
  )
}

export default RechercheApprentissage
