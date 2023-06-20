import React from "react"
import SatisfactionForm from "../components/SatisfactionForm/SatisfactionForm.js"
import { NextSeo } from "next-seo"

const FormulaireIntention = () => {
  return (
    <>
      <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." />
      <SatisfactionForm formType="intention" />
    </>
  )
}

export default FormulaireIntention
