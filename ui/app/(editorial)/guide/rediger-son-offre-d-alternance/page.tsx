import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide/const"
import { ARTICLES as ARTICLES_CFA } from "@/app/(editorial)/guide-cfa/const"
import { ARTICLES as ARTICLES_RECRUTEUR } from "@/app/(editorial)/guide-recruteur/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  ...PAGES.static.guideRedigerSonOffreDAlternance.getMetadata(),
  alternates: { canonical: PAGES.static.guideRedigerSonOffreDAlternance.getPath() },
}

const ALLER_PLUS_LOIN_ITEMS_RECRUTEUR = [ARTICLES["decouvrir-l-alternance"], ARTICLES["apprentissage-et-handicap"], ARTICLES_RECRUTEUR["cerfa-apprentissage-et-professionnalisation"]]
const ALLER_PLUS_LOIN_ITEMS_CFA = [ARTICLES["decouvrir-l-alternance"], ARTICLES["apprentissage-et-handicap"], ARTICLES_CFA["la-carte-etudiant-des-metiers"]]
const ALLER_PLUS_LOIN_ITEMS_DEFAULT = [ARTICLES["decouvrir-l-alternance"], ARTICLES["apprentissage-et-handicap"], ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"]]

const getAllerPlusLoinItems = (source?: string): typeof ALLER_PLUS_LOIN_ITEMS_DEFAULT => {
  switch (source) {
    case "guide-recruteur":
      return ALLER_PLUS_LOIN_ITEMS_RECRUTEUR
    case "guide-cfa":
      return ALLER_PLUS_LOIN_ITEMS_CFA
    default:
      return ALLER_PLUS_LOIN_ITEMS_DEFAULT
  }
}

const RedigerSonOffreDAlternancePage = async ({ searchParams }: { searchParams: Promise<Record<string, string>> }) => {
  const source = new URLSearchParams(await searchParams).get("source") || undefined

  const pages = [source === "guide-cfa" ? PAGES.static.guideCfa : PAGES.static.guideRecruteur, PAGES.static.guideRedigerSonOffreDAlternance]

  const descriptionParts = [
    "Lors de la publication de votre offre sur La bonne alternance, vous avez la possibilité de rédiger librement le descriptif du poste. Cette liberté implique quelques responsabilités : certaines règles sont obligatoires, d'autres relèvent plutôt de bonnes pratiques visant à améliorer l'attractivité de votre offre. Cet article résume les deux et détaille les vérifications complémentaires systématiques de notre système de modération.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["rediger-son-offre-d-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["rediger-son-offre-d-alternance"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={getAllerPlusLoinItems(source)}
      redirectionInterne={<RedirectionInterne source={source} />}
      page={PAGES.static.guideRedigerSonOffreDAlternance}
    >
      <Section title="Le volet réglementaire">
        <Paragraph>Certains critères pour bien rédiger votre offre sont réglementaires et obligatoires :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Paragraph component="span" bold>
                Non-discrimination :
              </Paragraph>{" "}
              interdiction de mentionner ou sous-entendre un critère discriminatoire (sexe, origine, apparence physique, situation de famille, grossesse, état de santé, handicap,
              orientation sexuelle, opinions politiques ou religieuses, etc.), sauf exigence professionnelle essentielle et justifiée.
              <br />
              Texte de référence : Code pénal art. 225-1 et 225-2, Code du travail L1132-1
            </>,
            <>
              <Paragraph component="span" bold>
                Intitulé non genré :
              </Paragraph>{" "}
              le titre du poste doit être épicène ou suivi de (H/F/X).
              <br />
              Texte de référence : Code du travail L1142-1
            </>,
            <>
              <Paragraph component="span" bold>
                Nature du contrat :
              </Paragraph>{" "}
              le texte doit refléter que c'est un contrat de formation en alternance (apprentissage ou professionnalisation), pas un poste salarié classique déguisé. Les missions
              doivent être cohérentes avec l'acquisition du diplôme visé.
              <br />
              Texte de référence : Code du travail, partie apprentissage
            </>,
            <>
              <Paragraph component="span" bold>
                Langue française :
              </Paragraph>{" "}
              le descriptif doit être rédigé en français si le poste s'exerce en France.
              <br />
              Texte de référence : Loi Toubon
            </>,
            <>
              <Paragraph component="span" bold>
                Absence de mentions trompeuses :
              </Paragraph>{" "}
              pas de promesses fausses sur les conditions de travail, les horaires, l'encadrement ou les perspectives.
              <br />
              Texte de référence : Principe général, sanctionnable au titre de la tromperie
            </>,
            <>
              <Paragraph component="span" bold>
                Coordonnées et données personnelles :
              </Paragraph>{" "}
              pas de collecte de données personnelles superflues dans l'annonce elle-même (photo, situation familiale demandés au candidat).
              <br />
              Texte de référence : RGPD, principe de minimisation
            </>,
          ]}
        />
        <Paragraph>
          Certaines missions sont interdites aux mineurs, prenez-en connaissance en lisant{" "}
          <DsfrLink href="https://www.service-public.fr/particuliers/vosdroits/F2344" aria-label="Consulter les informations sur le travail des mineurs">
            cet article
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph>
          Texte de référence :{" "}
          <DsfrLink
            href="https://www.legifrance.gouv.fr/codes/id/LEGISCTA000028058860"
            aria-label="Consulter le code du travail relatif aux travaux interdits et réglementés pour les jeunes travailleurs"
          >
            Code du travail, travaux interdits et réglementés pour les jeunes travailleurs
          </DsfrLink>
        </Paragraph>
      </Section>
      <Section title="Les bonnes pratiques">
        <Paragraph>Afin de rendre votre offre attractive, nous vous conseillons de :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Paragraph component="span" bold>
                Distinguer "compétences à acquérir" et "compétences exigées" :
              </Paragraph>{" "}
              un alternant est là pour apprendre. Une liste de prérequis dignes d'un poste senior décourage et n'est pas cohérente avec le statut.
            </>,
            <>
              <Paragraph component="span" bold>
                Nommer le rôle du tuteur ou maître d'apprentissage :
              </Paragraph>{" "}
              rassure sur l'encadrement, point de vigilance fréquent chez les jeunes candidats.
            </>,
            <>
              <Paragraph component="span" bold>
                Mentionner la formation visée ou le CFA partenaire si existant :
              </Paragraph>{" "}
              favorise la qualification des candidatures au regard de vos besoins.
            </>,
            <>
              <Paragraph component="span" bold>
                Indiquer les perspectives après le contrat :
              </Paragraph>{" "}
              embauche possible, poursuite d'études : donne une perspective de poursuite et aide le candidat à se projeter.
            </>,
            <>
              <Paragraph component="span" bold>
                Structurer en blocs courts :
              </Paragraph>{" "}
              missions / profil recherché / environnement de travail / modalités pratiques. Un pavé de texte unique nuit à la lecture.
            </>,
            <>
              <Paragraph component="span" bold>
                Ton clair, sans jargon :
              </Paragraph>{" "}
              le public cible inclut des jeunes parfois peu familiers du vocabulaire d'entreprise.
            </>,
            <>
              <Paragraph component="span" bold>
                Éviter les listes de prérequis à rallonge :
              </Paragraph>{" "}
              trois compétences bien choisies valent mieux que dix qui découragent.
            </>,
          ]}
        />
      </Section>
      <Section title="Ce que notre système de modération pourra corriger ou bloquer">
        <Paragraph>
          Afin d'assurer la qualité des offres diffusées aux candidats, un mécanisme de modération est systématiquement appliqué à votre offre. Voici ce que ce dernier vérifiera :
        </Paragraph>
        <ParagraphList
          listItems={[
            "L'orthographe, la grammaire et la ponctuation seront systématiquement corrigées.",
            "La structure et la clarté de la formulation pourront être améliorées.",
            "Les informations factuelles sur le poste seront conservées et non modifiées : responsabilités liées au poste, avantages, compétences, salaires et informations légales de l'entreprise.",
            "Toutes les mentions discriminantes, haineuses, offensantes, ou à caractère sexuel seront systématiquement supprimées ou corrigées.",
            "Pour des raisons de sécurité, toute information personnelle (adresse e-mail, numéro de téléphone, etc.) ne sera pas affichée sur l'offre.",
          ]}
        />
        <Paragraph>
          En conclusion, le principal piège est le copier-coller d'une fiche de poste classique, en oubliant qu'un alternant est avant tout en formation. Demander une liste de
          compétences déjà maîtrisées, décrire uniquement des missions de production sans mentionner l'apprentissage, ou lister des exigences dignes d'un profil confirmé reste le
          risque principal. L'offre attire alors les mauvais candidats, ou décourage les bons qui pensent ne pas être à la hauteur. Avant de publier votre offre, une question
          simple à vous poser pourrait être : "Est-ce que cette annonce donnerait envie à quelqu'un qui ne sait pas encore tout faire, mais qui veut apprendre ?"
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default RedigerSonOffreDAlternancePage
