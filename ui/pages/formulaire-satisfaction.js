import React from "react"
import SatisfactionForm from "components/SatisfactionForm/SatisfactionForm"
import { NextSeo } from "next-seo"

const FormulaireSatisfaction = () => {
  return (
    <>
      <NextSeo title="Formulaire de satisfaction | La bonne alternance | Trouvez votre alternance" description="Formulaire de satisfaction." />
      <SatisfactionForm formType="avis" />
    </>
  )
}

export default FormulaireSatisfaction
