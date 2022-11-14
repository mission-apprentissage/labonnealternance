import React, { useEffect } from "react";
import SearchForTrainingsAndJobs from "../components/SearchForTrainingsAndJobs";
import { useRouter } from "next/router";
import { initParametersFromQuery } from "services/config";
import { ScopeContextProvider } from "context/ScopeContext.js";
import { NextSeo } from "next-seo";
import { ParameterContext } from "../context/ParameterContextProvider";

const RechercheEmploi = () => {
  const router = useRouter();

  const parameterContext = React.useContext(ParameterContext);

  useEffect(() => {
    initParametersFromQuery({ router, parameterContext });
  }, []);

  return (
    <>
      <NextSeo
        title="Recherche d'emploi | La bonne alternance | Trouvez votre alternance"
        description="Recherche d'emploi sur le site de La bonne alternance."
      />
      <ScopeContextProvider value={{ isJob: true, isTraining: false, path: "/recherche-emploi" }}>
        <SearchForTrainingsAndJobs />
      </ScopeContextProvider>
    </>
  );
};

export default RechercheEmploi;
