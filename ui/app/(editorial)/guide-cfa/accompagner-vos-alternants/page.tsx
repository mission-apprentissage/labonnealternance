import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES as ARTICLES_PARTAGES } from "@/app/(editorial)/guide/const"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"
import { BandeauAuthentificationCfa } from "../BandeauAuthentificationCfa"

export const metadata: Metadata = PAGES.static.guideCfaAccompagnerVosAlternants.getMetadata()

const AccompagnerVosAlternantsPage = async () => {
  const { user } = await getSession()
  const pages = [PAGES.static.guideCfa, PAGES.static.guideCfaLaCarteEtudiantDesMetiers]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["accompagner-vos-alternants"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["accompagner-vos-alternants"].updatedAt} />}
      bandeau={!user && <BandeauAuthentificationCfa />}
      description={
        <DescriptionSection
          descriptionParts={[
            "Quand un jeune cherche une alternance, son réflexe naturel est de parcourir les annonces. Mais les offres en alternance l'exposent à une concurrence directe et immédiate sur des postes déjà très sollicités. Or, une part significative des recrutements en alternance se fait hors offre : l'entreprise n'a pas encore formalisé son besoin, ou ne cherche pas activement, mais reste ouverte à un bon profil qui se présente au bon moment.",
            "La candidature spontanée, bien préparée, permet de se positionner sur ce vivier invisible. Elle n'est pas une alternative aux offres, c'est une démarche parallèle qui augmente mécaniquement les chances de décrocher un contrat.",
          ]}
        />
      }
      allerPlusLoinItems={[ARTICLES_PARTAGES["decouvrir-l-alternance"], ARTICLES_PARTAGES["apprentissage-et-handicap"], ARTICLES["la-carte-etudiant-des-metiers"]]}
      parentPage={PAGES.static.guideCfa}
      page={PAGES.static.guideCfaAccompagnerVosAlternants}
    >
      <Section title="Comment La bonne alternance identifie ces entreprises auprès desquelles adresser des candidatures spontanées">
        <Paragraph>
          La bonne alternance expose des entreprises susceptibles de recruter en alternance afin de faciliter les démarches de candidatures spontanées des candidats.
        </Paragraph>
        <Paragraph>
          L’objectif est d’exposer le marché caché du recrutement : non seulement des entreprises qui ont déjà recruté en alternance par le passé, mais également des entreprises
          qui ne l’ont pas encore fait et qui ont de bonnes probabilités de le faire. Ce calcul se base sur les caractéristiques des entreprises suivantes : leurs données
          financières, le nombre de CDI dans l’entreprise, mais aussi des informations comme la pyramide des âges et le turnover. La bonne alternance opère également un roulement
          des entreprises affichées, afin de lisser le nombre de candidatures spontanées reçues par entreprise, et ainsi réduire la concurrence.
        </Paragraph>
        <Paragraph>
          Par exemple, en 2025, La bonne alternance a collecté près de 25 000 offres en direct auprès des recruteurs, a agrégé près de 300 000 offres en alternance issues de
          partenaires (France Travail, Hellowork, etc.), et a exposé plus de 300 000 entreprises auprès desquelles adresser des candidatures spontanées.
        </Paragraph>
        <Paragraph>
          En 2025, La bonne alternance c’était près de 378 000 candidatures à des offres et plus de 600 000 candidatures spontanées. Notez que 60% des contrats signés avec La bonne
          alternance sont des contrats issus de candidatures spontanées !
        </Paragraph>
      </Section>
      <Section title="Ce que ça change pour votre accompagnement">
        <Paragraph>En tant que CFA, vous avez un rôle clé pour rendre cette démarche concrète. Quelques pistes :</Paragraph>
        <Paragraph>
          <strong>Présenter la plateforme tôt dans le parcours.</strong>
        </Paragraph>
        <Paragraph>
          Idéalement avant même que vos alternants commencent à postuler, pour qu'ils comprennent qu'il existe deux viviers d’opportunités distincts sur la plateforme et comment
          les utiliser ensemble. Les entreprises auxquelles adresser des candidatures spontanées sont étiquetées “candidature spontanée”.
        </Paragraph>
        <Paragraph>
          <strong>Travailler la recherche avec eux :</strong>
        </Paragraph>
        <ParagraphList
          listItems={[
            "La qualité des résultats dépend du métier et de la zone géographique renseignés. Les jeunes se limitent parfois aux intitulés d’offres qu’ils connaissent déjà. Il est alors intéressant de leur montrer comment étendre leurs critères de recherche, et se laisser surprendre par des offres un peu plus originales.",
            "Les entreprises proposées pour des candidatures spontanées n’ont pas d’intitulé d’offre explicite, ni de description de poste. C’est au candidat de se renseigner sur l’entreprise, de vérifier si les activités de l’entreprise correspondent aux compétences que le jeune va devoir développer lors de ses missions.",
          ]}
        />
        <Paragraph>
          <strong>Rappeler les principes clés d’une candidature spontanée :</strong>
        </Paragraph>
        <ParagraphList
          listItems={[
            "L’entreprise ne sait pas pourquoi le candidat la contacte, le message d’accroche doit être limpide et aller droit au but, sans oublier les informations essentielles pour que le recruteur puisse se projeter : quelle formation prépare le candidat (éviter les acronymes peu parlant) ? quel poste vise-t’il ? Quel est le rythme de la formation ? etc.",
            "Sur La bonne alternance, les fiches entreprises auxquelles adresser des candidatures spontanées présentent des conseils aux candidats, invitez vos alternants à les lire attentivement !",
          ]}
        />
      </Section>
      <Section title="Conseils concrets à transmettre aux jeunes">
        <Paragraph>
          <strong>Personnaliser chaque message.</strong> Un message générique, ça se voit immédiatement. Le candidat doit montrer qu'il a regardé ce que fait l'entreprise : son
          secteur, ses services ou produits, ses valeurs si elles sont accessibles. Une ou deux phrases qui prouvent qu'il a fait le minimum de recherche suffisent à sortir du lot.
        </Paragraph>
        <Paragraph>
          <strong>Être direct sur ce qu'il cherche.</strong> Pas besoin d'un roman. Un objet clair ("Candidature alternance BTS Commerce, rentrée septembre 2025"), une présentation
          en deux phrases, ce qu'il peut apporter, et une invitation à échanger.
        </Paragraph>
        <Paragraph>
          <strong>Joindre un CV à jour.</strong> Évident, mais souvent bâclé. Le CV doit correspondre à la cible : mettre en avant les expériences ou compétences en lien avec
          l'activité de l'entreprise, même si elles viennent de jobs d'été ou d'engagements associatifs.
        </Paragraph>
        <Paragraph>
          <strong>Ne pas attendre une réponse pour relancer.</strong> Une relance polie une à deux semaines après, si le candidat n'a pas eu de retour, est tout à fait légitime.
          Elle montre de la persévérance sans être insistant. La bonne alternance propose un fichier de suivi pour aider les candidats à ne pas perdre le fil.
        </Paragraph>
        <Paragraph>
          <strong>Viser large, mais pas n'importe comment.</strong> Envoyer 50 mails identiques ne sert à rien. Envoyer 15 mails personnalisés à des entreprises réellement
          identifiées comme pertinentes, c'est une stratégie. Aider vos alternants à se fixer un objectif hebdomadaire réaliste (5 à 7 candidatures ciblées) structure la démarche
          et évite le découragement.
        </Paragraph>
        <Paragraph>
          La plateforme La bonne alternance permet à vos alternants d'accéder à un vivier d'entreprises que les autres jobboards ne voient pas. Mais cet outil ne remplace pas
          l'accompagnement humain : c'est à vous de les aider à comprendre la démarche, à préparer des candidatures sérieuses, et à tenir dans la durée. Offres et candidatures
          spontanées sont complémentaires. Les jeunes qui utilisent les deux ont mécaniquement plus de chances de trouver.
        </Paragraph>
        <Paragraph>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: fr.spacing("6v") }}>
            <Image src="/images/guides/guide-cfa/telechargement_affiche.png" alt="Affiche La bonne alternance" width={139} height={198} />
            <Box sx={{ flex: 1 }}>
              <DsfrLink download="affiche-cfa-avril-2026.pdf" href="/ressources/affiche-cfa-avril-2026.pdf" style={{ color: "#000" }}>
                Télécharger l’affiche La bonne alternance, à exposer dans votre CFA.
              </DsfrLink>
            </Box>
          </Box>
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default AccompagnerVosAlternantsPage
