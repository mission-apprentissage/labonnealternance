import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { Section } from "@/app/(editorial)/_components/Section"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"

export const metadata: Metadata = PAGES.static.guideRecruteurJeSuisEmployeurPublic.getMetadata()

const JeSuisEmployeurPublicPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurJeSuisEmployeurPublic]

  const descriptionParts = [
    "Les employeurs du secteur public non industriel et commercial  (fonctions publiques d'État, territoriale et hospitalière, ainsi que les établissements publics administratifs) peuvent conclure un contrat  d’apprentissage.",
    "L’État, les collectivités territoriales et leurs établissements  publics administratifs ne peuvent pas conclure de contrat de  professionnalisation.",
    "Si le cadre juridique du contrat d’apprentissage est similaire dans  la fonction publique, la prise en charge financière et les démarches  administratives diffèrent du secteur privé.",
    <>
      Pour plus d'informations sur l'apprentissage dans la fonction publique, vous pouvez consulter{" "}
      <DsfrLink
        href="https://www.fonction-publique.gouv.fr/devenir-agent-public/lapprentissage-dans-la-fonction-publique"
        aria-label="Consulter le Portail de la fonction publique"
      >
        le Portail de la fonction publique
      </DsfrLink>
      .
    </>,
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["je-suis-employeur-public"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["je-suis-employeur-public"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["decouvrir-l-alternance"], ARTICLES["cerfa-apprentissage-et-professionnalisation"], ARTICLES["apprentissage-et-handicap"]]}
    >
      <Section title="Démarches à suivre">
        <Paragraph>
          Les offres de contrat d'apprentissage dans la fonction publique peuvent être déposées sur{" "}
          <DsfrLink href="https://www.pass.fonction-publique.gouv.fr/" aria-label="Consulter le site de la Place de l'apprentissage et des stages (PASS)">
            la Place de l'apprentissage et des stages (PASS)
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph>Le contrat d'apprentissage conclu dans une administration est un contrat de droit privé à durée limitée (CDL).</Paragraph>
        <Paragraph>Le contrat est signé par l'employeur et l'apprenti (et par son représentant légal, si l'apprenti est mineur).</Paragraph>
        <Paragraph>1 exemplaire est remis à l'apprenti, l'autre est conservé par l'employeur.</Paragraph>
        <Paragraph>
          Toute modification d'un élément essentiel du contrat fait l'objet d’un avenant transmis à la Direction départementale en charge de l'emploi, du travail et des solidarités
          (DDETS ou DDETS-PP, ex-Direccte).
        </Paragraph>
        <Paragraph>
          Dans les 5 jours ouvrables qui suivent le début de l'exécution du contrat d'apprentissage, l'employeur transmet le contrat à la DDETS ou à la DDETSPP.
        </Paragraph>
        <Paragraph>
          Cette transmission se fait par voie dématérialisée en utilisant{" "}
          <DsfrLink href="https://celia.emploi.gouv.fr/" aria-label="Consulter la plate-forme Célia">
            la plate-forme de dématérialisation des contrats d'apprentissage de la fonction publique Célia
          </DsfrLink>
          . Cette plate-forme permet aux employeurs publics de saisir et générer le Cerfa, puis de transmettre directement le contrat à la DDETS ou à la DDETSPP.
        </Paragraph>
      </Section>
      <Section title="Prise en charge financière">
        <Paragraph>À noter : les employeurs du secteur public non industriel et commercial ne sont pas éligibles à l’aide au recrutement d’apprentis de 6 000€.</Paragraph>
        <Paragraph>Les modalités de prise en charge financière du contrat d’apprentissage diffèrent selon la fonction publique :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              Pour la fonction publique d’Etat, vous pouvez consulter{" "}
              <DsfrLink href="https://www.fonction-publique.gouv.fr/devenir-agent-public/lapprentissage-dans-la-fonction-publique" aria-label="Consulter le site de la DGAFP">
                le site de la DGAFP
              </DsfrLink>
              .
            </>,
            <>
              Pour la fonction publique territoriale, vous pouvez consulter{" "}
              <DsfrLink href="https://www.cnfpt.fr/se-former/accueillir-apprenti/lapprentissage-collectivites-territoriales/national" aria-label="Consulter le site du CNFPT">
                le site du CNFPT
              </DsfrLink>
              .
            </>,
            <>
              Pour la fonction publique hospitalière, vous pouvez consulter{" "}
              <DsfrLink href="https://www.anfh.fr/thematiques/apprentissage" aria-label="Consulter le site de l’ANFH">
                le site de l’ANFH
              </DsfrLink>
              .
            </>,
          ]}
        />
        <Paragraph>
          Tout agent public qui exerce la fonction de maître d'apprentissage acquiert des{" "}
          <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/F34030" aria-label="Consulter les droits à la formation">
            droits à la formation
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph>
          Depuis le 1er janvier 2022, le maître d'apprentissage dans la fonction publique d'État bénéficie d'une{" "}
          <DsfrLink href="https://www.fonction-publique.gouv.fr/files/files/ArchivePortailFP/www.fonction-publique.gouv.fr/allocation-forfaitaire-annuelle-de-500-euros-pour-maitres-dapprentissage.html">
            allocation forfaitaire annuelle
          </DsfrLink>{" "}
          de 500 €.
        </Paragraph>
      </Section>
      <Section title="L'apprentissage et le handicap dans la fonction publique">
        <Paragraph fontWeight={"bold"}>Les aides du FIPHFP</Paragraph>
        <Paragraph>
          Dans la fonction publique, le FIPHFP (Fonds pour l’insertion des personnes handicapées dans la fonction publique) finance des aides qui permettent aux employeurs publics
          de favoriser l’insertion professionnelle et le maintien dans l’emploi des personnes en situation de handicap.
        </Paragraph>
        <Paragraph>
          Ainsi, l’indemnité d’apprentissage vise à favoriser le développement de l’apprentissage en participant au financement de la rémunération de l’apprenti. Le montant pris en
          charge est de 80% de la rémunération de l’apprenti.
        </Paragraph>
        <Paragraph>
          Pour en savoir plus, vous pouvez consulter{" "}
          <DsfrLink href="https://www.fiphfp.fr/employeurs/ressources-employeurs/centre-de-ressources?item=2924" aria-label="Consulter le catalogue des interventions du FIPHFP">
            le catalogue des interventions du FIPHFP
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph fontWeight={"bold"}>Le recrutement et, le cas échéant, la titularisation d'apprentis BOETH dans la fonction publique</Paragraph>
        <Paragraph>
          La loi du 6 août 2019 de transformation de la fonction publique a instauré un dispositif expérimental, jusqu'au 6 août 2025, permettant la titularisation dans la fonction
          publique (secteur public non industriel et commercial) des bénéficiaires de l'obligation d'emploi de travailleurs handicapés (BOETH), à l'issue de leur contrat
          d'apprentissage (décret n°2020-530 du 5 mai 2020).
        </Paragraph>
        <Paragraph>
          La titularisation des apprentis BOETH à l'issue de leur contrat d'apprentissage dans la fonction publique n'est pas automatique : il est nécessaire que l'apprenti fasse
          acte de candidature et que l'employeur public décide de le titulariser en tenant compte notamment des capacités du candidat à exercer les missions, de sa motivation, du
          bilan de la période d'apprentissage, de son parcours professionnel ainsi que de ses connaissances sur l'environnement professionnel de l'emploi ou des emplois faisant
          l'objet de sa candidature.
        </Paragraph>
        <Paragraph>
          Ces recrutements sont pris en compte dans la proportion minimale de 6% des postes offerts aux concours dans un corps, réservée aux modalités spécifiques de recrutement
          des personnes en situation de handicap.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default JeSuisEmployeurPublicPage
