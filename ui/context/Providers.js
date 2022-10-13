import React from "react";
import SearchResultContextProvider from "./SearchResultContextProvider";
import ParameterContextProvider from "./ParameterContextProvider";
import DisplayContextProvider from "./DisplayContextProvider";
import PlausibleProvider from "next-plausible";

const Providers = ({ env, children }) => {
  return (
    <PlausibleProvider
      domain={
        env !== "production"
          ? "labonnealternance-recette2.apprentissage.beta.gouv.fr"
          : "labonnealternance.apprentissage.beta.gouv.fr"
      }
      trackOutboundLinks={true}
      trackLocalhost={true}
      enabled={true}
    >
      <SearchResultContextProvider>
        <ParameterContextProvider>
          <DisplayContextProvider>{children}</DisplayContextProvider>
        </ParameterContextProvider>
      </SearchResultContextProvider>
    </PlausibleProvider>
  );
};

export default Providers;
