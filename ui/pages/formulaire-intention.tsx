import { NextSeo } from "next-seo"

import { SatisfactionForm } from "@/components/SatisfactionForm/SatisfactionForm"

const FormulaireIntention = () => {
  return (
    <>
      <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." />
      <SatisfactionForm />
    </>
  )
}

export default FormulaireIntention
