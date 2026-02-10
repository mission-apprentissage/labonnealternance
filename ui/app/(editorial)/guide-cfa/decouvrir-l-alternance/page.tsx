import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideCFADecouvrirLAlternance.getMetadata()

const DecouvrirLAlternancePage = () => {
  const pages = [PAGES.static.guideCFA, PAGES.static.guideCFADecouvrirLAlternance]

  const descriptionParts = [
    "L’alternance est une modalité de formation qui repose sur un temps de formation en organisme de formation et un temps de formation en entreprise.",
    "L’alternance est un type de formation dans lequel le jeune passe au minimum 25% de son temps à l’école (en formation théorique au sein d’écoles spécifiques nommées organismes de formation) et le reste en entreprise. Ainsi, le jeune a une formation duale : théorique et pratique.",
    "Les organismes de formation (aussi appelés CFA pour Centre de Formation d’Apprentis) forment les jeunes à un diplôme, ou un titre professionnel spécifiques. Ils les accompagnent pour trouver un contrat en alternance.",
    "Il existe deux dispositifs de formation en alternance : le contrat d’apprentissage et le contrat de professionnalisation.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["decouvrir-l-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["decouvrir-l-alternance"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["preparer-son-projet-en-alternance"], ARTICLES["se-faire-accompagner"], ARTICLES["comprendre-la-remuneration"]]}
    >
      <Section title="Qu'est-ce que l'alternance ?">
        <Paragraph>Les conditions pour être alternant diffèrent selon le type de contrat choisi</Paragraph>
        <Paragraph>Pour le contrat d'apprentissage :</Paragraph>
        <ParagraphList
          listItems={[
            "Les jeunes de 16 ans à 29 ans révolus;",
            <>
              Certains publics au-delà de 29 ans : les apprentis préparant un diplôme ou titre supérieur à celui obtenu via un précédent contrat,{" "}
              <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage-amenage" aria-label="Consulter les informations sur les personnes en situation de handicap">
                les personnes en situation de handicap
              </DsfrLink>
              , les personnes ayant un projet de création ou de reprise d’entreprise nécessitant le diplôme ou titre visé, les sportifs de haut niveau.
            </>,
            "les personnes entrant dans leur 16ème année (15 ans et un jour), si elles ont terminé leur cycle du collège (brevet obtenu ou pas), peuvent commencer à exécuter un contrat d’apprentissage.",
          ]}
        />
        <Paragraph>Pour le contrat de professionnalisation :</Paragraph>
        <ParagraphList
          listItems={[
            "Jeunes âgés de 16 à 25 ans révolus afin de compléter leur formation initiale ;",
            "Demandeurs d’emploi âgés de 26 ans et plus.",
            "Bénéficiaires du revenu de solidarité active (RSA), de l’allocation de solidarité spécifique ou de l’allocation aux adultes handicapés (AAH) ;",
            "Personnes ayant bénéficié d’un contrat aidé (contrat unique d’insertion - CUI).",
          ]}
        />
      </Section>
    </LayoutArticle>
  )
}

export default DecouvrirLAlternancePage
