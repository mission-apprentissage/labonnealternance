import Head from "next/head"
import { NextSeo } from "next-seo"

import WidgetPostuler from "../components/ItemDetail/CandidatureLba/WidgetPostuler"

const Postuler = () => {
  return (
    <>
      <NextSeo title="Recherche d'emploi | La bonne alternance | Trouvez votre alternance" description="Recherche d'emploi sur le site de La bonne alternance." />
      {/* @ts-expect-error: TODO */}
      <Head />
      <WidgetPostuler />
    </>
  )
}

export default Postuler
