import type { Metadata } from "next"
import { Box, Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { Section } from "@/app/(editorial)/_components/Section"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { InfoSection } from "@/app/(editorial)/_components/InfoSection"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { TableArticle } from "@/app/(editorial)/_components/TableArticle"

export const metadata: Metadata = PAGES.static.guideAlternantApprentissageEtHandicap.getMetadata()

const ApprentissageEtHandicapPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantApprentissageEtHandicap]

  const descriptionParts = [
    "En France on estime que 8% de la population est en situation de handicap. Ces personnes rencontrent malheureusement des difficultés multiples pour accéder à un emploi du fait d'une méconnaissance du handicap et d'idées reçues.",
    "L’apprentissage constitue un levier privilégié pour l’accès et le maintien dans l’emploi des personnes handicapées, en garantissant une formation certifiante, une rémunération et une insertion professionnelle rapide et durable. En 2025, plus de 15 000 contrats d'apprentissage avaient été signés grâce à une politique publique volontariste et inclusive.",
    "Avoir un handicap ne signifie en aucun cas être moins compétent. Pourtant, les idées reçues persistent… La réalité ? Les personnes non sensibilisées pensent uniquement au handicap moteur, pourtant 80 % des handicaps sont invisibles. Ils peuvent tout autant nécessiter des aménagements.",
    "Pour faciliter la formation du jeune travailleur en situation de handicap, certaines règles du contrat d’apprentissage sont aménagées comme la durée du contrat, le temps de travail, le déroulement de la formation ou encore la limite d’âge.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["apprentissage-et-handicap"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["apprentissage-et-handicap"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"], ARTICLES["se-faire-accompagner"], ARTICLES["la-rupture-de-contrat"]]}
    >
      <InfoSection>
        <Box>
          Bon à savoir : le Ministère du Travail et de l'Emploi, en partenariat avec l’AGEFIPH et le FIHFP, a publié{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/apprentissage-et-handicap-un-guide-pour-les-employeurs-et-les-apprentis"
            aria-label="Consulter le guide sur l’apprentissage & le handicap"
          >
            un guide sur l’apprentissage & le handicap
          </DsfrLink>{" "}
          à destination des employeurs, des CFA et des personnes en situation de handicap.
        </Box>
      </InfoSection>
      <Section title="Qui peut bénéficier d’un contrat d’apprentissage aménagé ?">
        <Paragraph>Le contrat d’apprentissage aménagé est accessible dans le secteur privé comme dans le secteur public :</Paragraph>
        <Box display={"flex"} flexDirection={"column"} gap={0}>
          <ParagraphList
            listItems={[
              <>
                <Typography component="span" fontWeight={"bold"}>
                  dès l’âge de 16 ans (sauf dérogation) et sans limite d’âge maximal
                </Typography>{" "}
                (contrairement au contrat d’apprentissage de droit commun) pour :
              </>,
            ]}
          />
          <Box sx={{ ml: fr.spacing("10v"), mt: 0 }}>
            <ParagraphList
              listItems={[
                "Les personnes qui bénéficient de la reconnaissance de la qualité de travailleur handicapé (RQTH) ; ",
                "les personnes bénéficiaires de l'obligation d'emploi (BOE) (2), à l’exception des ayants droit de victimes ou pensionnés de guerre ; ",
              ]}
            />
          </Box>
          <ParagraphList
            listItems={[
              <>
                <Typography component="span" fontWeight={"bold"}>
                  aux jeunes âgés de 15 à 20 ans (“équivalences jeunes”)
                </Typography>
                , qui bénéficient soit :{" "}
              </>,
            ]}
          />
          <Box sx={{ ml: fr.spacing("10v"), mt: 0 }}>
            <ParagraphList
              listItems={[
                "D’un projet personnalisé de scolarisation (PPS) ;",
                "de l’attribution de l’allocation d’éducation de l’enfant handicapé (AEEH) ;",
                "de la prestation de compensation (PCH).",
              ]}
            />
          </Box>
        </Box>
        <Paragraph>
          La conclusion d’un contrat d’apprentissage aménagé est accessible à un candidat âgé de 16 ans au minimum (15 ans et un jour pour les personnes ayant terminé leur cycle du
          collège) et sans limite d’âge maximum.
        </Paragraph>
        <Paragraph>Les bénéficiaires de l’allocation aux adultes handicapés (AAH) peuvent bénéficier d’un contrat de professionnalisation.</Paragraph>
      </Section>
      <Section title="Quelle est la durée du contrat ?">
        <Paragraph>En principe, la durée d’un contrat d’apprentissage varie, selon la qualification préparée, entre 6 mois et 3 ans.</Paragraph>
        <Paragraph>
          La durée maximale du contrat d'apprentissage aménagé peut, elle, être portée jusqu’à 4 ans maximum. En effet, en fonction des besoins de l’apprenti en situation de
          handicap, l’enseignement délivré par le CFA en vue de conduire au diplôme prévu au contrat, est réparti sur une période égale à la durée habituelle d’apprentissage pour
          la formation considérée, augmentée d’un an au plus.
        </Paragraph>
      </Section>
      <Section title="Comment se déroule la formation ?">
        <Paragraph>La formation peut se dérouler dans tout centre de formation d’apprentis (CFA).</Paragraph>
        <Paragraph>
          Les CFA doivent tenir compte des besoins particuliers des apprentis en situation de handicap en procédant aux aménagements nécessaires pour le suivi de la formation, y
          compris pédagogiques.
        </Paragraph>
        <Paragraph>
          À leur entrée en CFA, le référent handicap de l'établissement doit évaluer les besoins de compensation de l'apprenti en situation de handicap pour déterminer les
          aménagements nécessaires. Ces derniers peuvent comporter aussi bien des aides humaines, animalières, techniques que des adaptations pédagogiques et d’apprentissage. Ce
          peut être également un soutien particulier sur des compétences clés qui auraient dû être acquises mais qui n’ont pu être consolidées. Ces adaptations et ces aménagements
          sont individualisés et personnalisés.
        </Paragraph>
        <Paragraph>
          La loi prévoit une majoration du niveau de prise en charge des contrats d’apprentissage aménagés, au bénéfice des CFA pour les aider à financer les aménagements. Cette
          majoration est limitée à 4000 euros par année d’exécution du contrat.
        </Paragraph>
      </Section>
      <Section title="Quelle est la rémunération ?">
        <Paragraph>
          Comme tout apprenti, la personne en situation de handicap est rémunérée en pourcentage du Smic ou du SMC (salaire minimum conventionnel de l’emploi occupé pour les 21 ans
          et plus), variable selon son âge et sa progression dans le ou les cycles de formation faisant l’objet de l’apprentissage.
        </Paragraph>
        <Paragraph>
          L’apprenti bénéficie d’une rémunération variant en fonction de son âge ; en outre, sa rémunération progresse chaque nouvelle année d’exécution de son contrat. Le salaire
          minimum perçu par l’apprenti correspond à un pourcentage du Smic ou du SMC.
        </Paragraph>
        <TableArticle
          headers={["Année d’exécution du contrat", "Apprenti de moins de 18 ans", "Apprenti de 18 ans à 20 ans", "Apprenti de 21 ans à 25 ans", "Apprenti de 26 ans et plus"]}
          data={[
            ["1ère année", "27%", "43%", "53%", "100%"],
            ["2ème année", "39%", "51%", "61%", "100%"],
            ["3ème année", "55%", "67%", "78%", "100%"],
          ]}
        />
        <Paragraph>*ou du salaire minimum conventionnel de l’emploi occupé</Paragraph>
        <Paragraph>
          Des dispositions conventionnelles ou contractuelles peuvent prévoir une rémunération plus favorable pour le salarié. En cas de succession de contrats, la rémunération est
          au moins égale au minimum réglementaire de la dernière année du précédent contrat, sauf changement de tranche d’âge plus favorable à l’apprenti.
        </Paragraph>
        <Paragraph>
          Dans les cas d’allongement de durée de la période de formation, le pourcentage du Smic pris en compte pour le calcul de la rémunération est majoré, pendant la période de
          prolongation, de 15 points par rapport à celui appliqué avant cette période. Si vous êtes en situation de handicap**, vous pouvez solliciter une aide de l’
          <DsfrLink href="https://www.agefiph.fr/" aria-label="Consulter le site de l'Agefiph">
            Agefiph**
          </DsfrLink>{" "}
          (si vous avez conclu un contrat avec un employeur du secteur privé), ou du
          <DsfrLink href="https://www.fiphfp.fr/" aria-label="Consulter le site du FIPHFP">
            FIPHFP
          </DsfrLink>{" "}
          (si vous avez conclu un contrat avec un employeur public).
        </Paragraph>
      </Section>
      <Section title="Quelles sont les aides spécifiques pour les employeurs d’un apprenti reconnu travailleur handicapé ?">
        <Paragraph>
          Les employeurs qui choisissent de recruter un apprenti en situation de handicap bénéficient d'une aide de l'État pour le recrutement et d’aides spécifiques :
        </Paragraph>
        <Box display={"flex"} flexDirection={"column"} gap={0}>
          <ParagraphList
            listItems={[
              <>
                <Typography component={"span"} fontWeight={"bold"}>
                  Pour les employeurs du secteur privé :
                </Typography>{" "}
                l’aide à l’embauche en contrat d’apprentissage d’une personne handicapée proposée par l’
                <DsfrLink href="https://www.agefiph.fr/" aria-label="Consulter le site de l'Agefiph">
                  Agefiph.
                </DsfrLink>
              </>,
              <Typography component="span" fontWeight={"bold"}>
                Pour les employeurs du secteur public (non industriel et commercial) (qui ne bénéficient pas de l'aide de l'État) :
              </Typography>,
            ]}
          />
          <Box sx={{ ml: fr.spacing("10v") }}>
            <ParagraphList
              listItems={[
                "l’indemnité d’apprentissage en cas de recrutement d’une personne en situation de handicap avec une prise en charge par le FIPHFP du coût salarial chargé de l’apprenti à hauteur de 80 %;",
                "l’aide financière destinée à la prise en charge (par un opérateur externe) des frais d’accompagnement des personnes en situation de handicap pour la mise en œuvre d’un dispositif d’accompagnement et de soutien",
                "la prime d’insertion si l’employeur conclut avec l’apprenti un contrat à durée indéterminée à l’issue de sa période d’apprentissage.",
                "Etc.",
              ]}
            />
          </Box>
          <ParagraphList
            listItems={[
              <>
                <DsfrLink href="https://www.fiphfp.fr/employeurs/nos-aides-financieres/catalogue-des-interventions" aria-label="Consulter le catalogue des interventions du FIPHFP">
                  Consulter le catalogue des interventions du FIPHFP
                </DsfrLink>{" "}
                si vous avez conclu un contrat avec un employeur public ;
              </>,
              <>
                <DsfrLink
                  href="https://www.agefiph.fr/sites/default/files/medias/fichiers/2025-02/Metodia_Janvier_2025.pdf"
                  aria-label="Consulter l’offre d’aides financières et services de l’Agefiph"
                >
                  Consultez l’offre d’aides financières et services de l’Agefiph
                </DsfrLink>
                si vous avez conclu un contrat avec un employeur privé.
              </>,
            ]}
          />
        </Box>
        <Paragraph>
          L’Agefiph et le FIPHFP proposent également des aides techniques et humaines qui permettent aux employeurs publics de favoriser l’insertion professionnelle et le maintien
          dans l’emploi des personnes en situation de handicap, y compris celle des apprentis.
        </Paragraph>
      </Section>
      <Section title="Le recrutement et, le cas échéant, la titularisation d’apprentis BOETH dans la fonction publique">
        <Paragraph>
          La loi du 6 août 2019 de transformation de la fonction publique a instauré un dispositif expérimental, jusqu’au 6 août 2025, permettant la titularisation dans la fonction
          publique (secteur public non industriel et commercial) des bénéficiaires de l’obligation d’emploi de travailleurs handicapés (BOETH), à l’issue de leur contrat
          d’apprentissage (décret n° 2020-530 du 5 mai 2020).
        </Paragraph>
        <Paragraph>
          La titularisation des apprentis BOETH à l’issue de leur contrat d’apprentissage dans la fonction publique n’est pas automatique : il est nécessaire que l’apprenti fasse
          acte de candidature et que l’employeur public décide de le titulariser en tenant compte notamment des capacités du candidat à exercer les missions, de sa motivation, du
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

export default ApprentissageEtHandicapPage
