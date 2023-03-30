import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import React, { useEffect } from "react"
import SearchForTrainingsAndJobs from "../components/SearchForTrainingsAndJobs"
import { ParameterContext } from "../context/ParameterContextProvider"
import { ScopeContextProvider } from "../context/ScopeContext.js"
import { initParametersFromQuery } from "../services/config"
import { getSeoDescription, getSeoTitle } from "../utils/seoUtils.js"

const RechercheEmploi = () => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, parameterContext })
  }, [])

  return (
    <>
      <NextSeo title={getSeoTitle({ parameterContext, page: "Emplois" })} description={getSeoDescription({ parameterContext, page: "Emplois" })} />
      <ScopeContextProvider value={{ isJob: true, isTraining: false, path: "/recherche-emploi" }}>
        <SearchForTrainingsAndJobs />
      </ScopeContextProvider>
    </>
  )
}

export default RechercheEmploi
