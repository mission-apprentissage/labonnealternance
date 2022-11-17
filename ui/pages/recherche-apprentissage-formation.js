import React, { useEffect } from "react"
import SearchForTrainingsAndJobs from "../components/SearchForTrainingsAndJobs"
import { useRouter } from "next/router"
import { initParametersFromQuery } from "services/config"
import { ScopeContextProvider } from "context/ScopeContext.js"
import { NextSeo } from "next-seo"
import { ParameterContext } from "../context/ParameterContextProvider"

const RechercheApprentissageFormation = () => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, parameterContext })
  }, [])

  return (
    <>
      <NextSeo title="Recherche de formations | La bonne alternance | Trouvez votre alternance" description="Recherche de formations sur le site de La bonne alternance" />
      <ScopeContextProvider value={{ isJob: false, isTraining: true, path: "/recherche-apprentissage-formation" }}>
        <SearchForTrainingsAndJobs />
      </ScopeContextProvider>
    </>
  )
}

export default RechercheApprentissageFormation
