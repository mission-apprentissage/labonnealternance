import type { Metadata } from "next"
import { Typography } from "@mui/material"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantLesAidesFinancieresEtMaterielles.getMetadata()

const LesAidesFinancieresEtMateriellesPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantLesAidesFinancieresEtMaterielles]

  const descriptionParts = [
    "De nombreuses aides existent pour faciliter votre entrée en alternance. Pensez à vous y prendre le plus tôt possible, certaines démarches pouvant prendre plusieurs semaines.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["les-aides-financieres-et-materielles"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["les-aides-financieres-et-materielles"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
    >
      <Section title="Vous cherchez un logement pour votre alternance ?">
        <Paragraph>Plusieurs solutions et aides existent :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography component="span" fontWeight={"bold"}>
                APL (Aide personnalisée au logement) :
              </Typography>{" "}
              En tant qu'alternant, vous avez droit aux aides au logement (APL, ALS, ALF) versées par la CAF selon votre situation. Un abattement fiscal est appliqué sur vos
              revenus d'apprenti pour le calcul de ces aides. Faites votre demande dès la signature de votre bail (l'aide n'est pas rétroactive).
              <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/F38630" aria-label="Consulter la liste des aides pour les apprentis">
                Demander une aide au logement (Service-public.fr)
              </DsfrLink>
            </>,
            <>
              <Typography component="span" fontWeight={"bold"}>
                Aide Mobili-Jeune :
              </Typography>{" "}
              il s’agit d’une subvention de 10 à 100 € par mois pendant 11 mois (renouvelable) pour alléger votre loyer si vous avez moins de 30 ans, êtes en alternance dans le
              secteur privé non agricole et que votre salaire est inférieur à 120% du SMIC. Cumulable avec les APL. Vous trouverez plus d’informations sur le site{" "}
              <DsfrLink href="https://www.actionlogement.fr/l-aide-mobili-jeune/" aria-label="Consulter les détails de l'aide mobili-jeune sur le site Action Logement">
                Action Logement
              </DsfrLink>
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Avance Loca-Pass® :
              </Typography>{" "}
              Pour financer le dépôt de garantie de votre location, l’avance Loca-pass vous avance sans intérêts.. En savoir plus sur l’Avance Loca-Pass
              <DsfrLink
                href="https://www.actionlogement.fr/guides/trouver-un-logement/quelles-aides-au-logement-pour-les-alternants-en-contrat-pro-ou-apprentissage"
                aria-label="Consulter les aides disponibles sur le site Action Logement"
              >
                (Action Logement)
              </DsfrLink>
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Logements pour alternants :
              </Typography>{" "}
              Certaines communes mettent à disposition des logements pour l'hébergement des alternants. Renseignez-vous en contactant la mairie de votre lieu de résidence ou le
              CROUS de votre académie.
            </>,
          ]}
        />
      </Section>
      <Section title="Mobilité et transport pendant l’alternance">
        <Paragraph>Votre employeur doit obligatoirement prendre en charge 50 % du coût de vos abonnements de transports en commun pour vos trajets domicile-travail.</Paragraph>
        <Paragraph>
          La plupart des régions proposent des aides pour les abonnements de transport en commun ou des réductions spécifiques (ex. TER, forfaits étudiants). Renseignez-vous
          directement auprès de votre conseil régional pour connaître les dispositifs actifs dans votre région.
        </Paragraph>
      </Section>
      <Section title="Connaitre toutes les aides auxquelles vous pouvez prétendre">
        <Paragraph>
          <DsfrLink href={"https://mes-aides.1jeune1solution.beta.gouv.fr/"} aria-label="Consulter le simulateur Mes-aides">
            Mes-aides
          </DsfrLink>{" "}
          met à disposition un simulateur d’aides pour découvrir simplement toutes les aides auxquelles vous pouvez être éligible (logement, mobilité, santé, emploi etc.). Faites
          une simulation personnalisée pour connaître toutes les aides auxquelles vous avez droit.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default LesAidesFinancieresEtMateriellesPage
