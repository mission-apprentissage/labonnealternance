import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import React, { useEffect } from "react"

import SearchForTrainingsAndJobs from "../components/SearchForTrainingsAndJobs/index.js"
import { ParameterContext } from "../context/ParameterContextProvider.js"
import { ScopeContextProvider } from "../context/ScopeContext.js"
import { initParametersFromQuery } from "../services/config.js"
import { getSeoDescription, getSeoTitle } from "../utils/seoUtils.js"

const RechercheApprentissage = () => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, parameterContext })
  }, [])

  return (
    <>
      <NextSeo title={getSeoTitle({ parameterContext, page: "Offres" })} description={getSeoDescription({ parameterContext, page: "Offres" })} />
      <ScopeContextProvider value={{ isJob: true, isTraining: true, path: "/recherche-apprentissage" }}>
        <SearchForTrainingsAndJobs />
      </ScopeContextProvider>
    </>
  )
}

export default RechercheApprentissage
