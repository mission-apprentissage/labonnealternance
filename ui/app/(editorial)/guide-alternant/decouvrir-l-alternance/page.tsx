import type { Metadata } from "next"
import { Box } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantDecouvrirLAlternance.getMetadata()

const DecouvrirLAlternancePage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantDecouvrirLAlternance]

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
      allerPlusLoinItems={[ARTICLES["preparer-son-projet-en-alternance"], ARTICLES["comprendre-la-remuneration"], ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"]]}
    >
      <Section title="Qu'est-ce que l'alternance ?">
        <Paragraph>Les conditions pour être alternant diffèrent selon le type de contrat choisi</Paragraph>
        <Paragraph>Pour le contrat d'apprentissage :</Paragraph>
        <ParagraphList
          listItems={[
            "Les jeunes de 16 ans à 29 ans révolus;",
            <>
              Certains publics au-delà de 29 ans : les apprentis préparant un diplôme ou titre supérieur à celui obtenu via un précédent contrat,{" "}
              <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage-amenage" aria-label="Consulter les informations sur le contrat d'apprentissage aménagé">
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

      <Section title="Qui peut être alternant ?">
        <Paragraph>Les conditions pour être alternant diffèrent selon le type de contrat choisi.</Paragraph>
        <Paragraph>Pour le contrat d’apprentissage :</Paragraph>
        <ParagraphList
          listItems={[
            "les jeunes de 16 ans à 29 ans révolus ;",
            <>
              certains publics au-delà de 29 ans : les apprentis préparant un diplôme ou titre supérieur à celui obtenu via un précédent contrat,{" "}
              <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage-amenage" aria-label="Consulter les informations sur le contrat d'apprentissage aménagé">
                les personnes en situation de handicap
              </DsfrLink>
              , les personnes ayant un projet de création ou de reprise d’entreprise nécessitant le diplôme ou titre visé, les sportifs de haut niveau ;
            </>,
            "les personnes entrant dans leur 16ème année (15 ans et un jour), si elles ont terminé leur cycle du collège (brevet obtenu ou pas), peuvent commencer à exécuter un contrat d’apprentissage.",
          ]}
        />
        <Paragraph>Pour le contrat de professionnalisation :</Paragraph>
        <ParagraphList
          listItems={[
            "jeunes âgés de 16 à 25 ans révolus afin de compléter leur formation initiale ;",
            "demandeurs d’emploi âgés de 26 ans et plus ;",
            "bénéficiaires du revenu de solidarité active (RSA), de l’allocation de solidarité spécifique ou de l’allocation aux adultes handicapés (AAH) ;",
            "personnes ayant bénéficié d’un contrat aidé (contrat unique d’insertion - CUI).",
          ]}
        />
      </Section>
      <Section title="Les certifications préparées en alternance">
        <Paragraph>Les certifications préparées en alternance diffèrent selon le contrat choisi.</Paragraph>
        <Paragraph>
          S’il s’agit d’un contrat d’apprentissage, il doit préparer à un diplôme ou un titre à finalité professionnelle enregistré au RNCP (
          <DsfrLink
            href="https://www.francecompetences.fr/recherche-resultats/?types=certification&search=&pageType=certification&active=1"
            aria-label="Consulter le Répertoire National de la Certification Professionnelle"
          >
            Répertoire National de la Certification Professionnelle
          </DsfrLink>
          ) éligible à l’apprentissage.
        </Paragraph>
        <Paragraph>S’il s’agit d’un contrat de professionnalisation, il peut s’agir :</Paragraph>
        <ParagraphList
          listItems={[
            "d’un diplôme ou d’un titre à finalité professionnelle enregistré au RNCP ;",
            "d’une qualification reconnue dans les classifications d’une convention collective nationale ;",
            "d’un certificat de qualification professionnelle (CQP) de branche ou interbranche",
          ]}
        />
      </Section>
      <Section title="Quelle est la durée d’une alternance ?">
        <Paragraph>La durée de l’alternance diffère selon le contrat choisi.</Paragraph>
        <Paragraph>Pour le contrat d’apprentissage :</Paragraph>
        <ParagraphList
          listItems={[
            "par principe, la durée du contrat d’apprentissage est égale à celle du cycle de formation théorique : au minimum six mois et au maximum trois ans, selon le diplôme préparé et/ou le niveau de l’apprenti ;",
            "pour les personnes en situation de handicap et les sportifs de haut niveau, la durée du contrat d’apprentissage peut être augmentée d’un an.",
          ]}
        />
        <Paragraph>Pour le contrat de professionnalisation :</Paragraph>
        <ParagraphList listItems={["entre six et douze mois ;", "cette durée peut être portée directement à 36 mois pour :"]} />
        <Box sx={{ ml: fr.spacing("10v"), mt: 0 }}>
          <ParagraphList
            listItems={[
              "les jeunes âgés de 16 à 25 ans révolus qui n’ont pas validé un second cycle de l’enseignement secondaire et qui ne sont pas titulaires d’un diplôme de l’enseignement technologique ou professionnel ;",
              "les jeunes de 16 à 25 ans révolus et les demandeurs d’emploi de 26 ans et plus, dès lors qu’ils sont inscrits depuis plus d’un an sur la liste des demandeurs d’emploi tenue par France Travail ;",
              "les bénéficiaires du RSA, de l’ASS, de l’AAH ou sortant d’un contrat unique d’insertion.",
            ]}
          />
        </Box>
      </Section>
      <Section title="La répartition du temps entre formation et entreprise">
        <Paragraph>
          S’agissant du contrat d’apprentissage, la durée de formation en centre de formation d’apprentis (CFA) ne peut pas être inférieure à 25% de la durée globale du contrat.
        </Paragraph>
        <Paragraph>S’agissant du contrat de professionnalisation, les actions de formation :</Paragraph>
        <ParagraphList
          listItems={[
            "sont d’une durée comprise entre 15 % et 25 % de la durée totale du contrat ;",
            "ne doivent pas être inférieures à 150 heures ;",
            "peuvent être portées au-delà de 25 % pour certaines catégories de bénéficiaires ou certaines qualifications. Ces catégories sont définies par un accord de branche.",
          ]}
        />
      </Section>
      <Section title="Combien coûte une formation en alternance ?">
        <Paragraph>
          Quel que soit le contrat choisi, les formations en alternance sont gratuites pour l’alternant et aucune contrepartie financière ne peut être demandée.
        </Paragraph>
        <Paragraph>Le coût de la formation est en effet pris en charge par l’opérateur de compétence (OPCO) de l’entreprise, selon diverses modalités.</Paragraph>
        <Paragraph>
          Dans la fonction publique il n’est pas possible de réaliser un contrat de professionnalisation. Par ailleurs, le contrat d’apprentissage est financé directement par
          l’employeur.
        </Paragraph>
      </Section>
      <Section title="Quelles sont les conditions de travail en apprentissage ?">
        <Paragraph>
          L’alternant est un salarié de l’entreprise à part entière. À ce titre, les lois, les règlements et la convention collective de la branche professionnelle et celle de
          l’entreprise lui sont applicables dans les mêmes conditions qu’aux autres salariés.
        </Paragraph>
        <Paragraph>
          Le temps de travail de l’alternant est identique à celui des autres salariés de l’entreprise et s’appuie sur une base de travail de 35 heures par semaine. Le temps de
          formation théorique est compris dans le temps de travail effectif.
        </Paragraph>
        <Paragraph>
          Toute la réglementation concernant les jeunes travailleurs de moins de 18 ans s’applique aux mineurs en contrat d’apprentissage ou de professionnalisation.
        </Paragraph>
        <Paragraph>
          Un contrat d’apprentissage ne peut pas être conclu à temps partiel (sauf pour les sportifs de haut niveau et les personnes en situation de handicap). Le contrat de
          professionnalisation peut être conclu à temps partiel dès lors que l’organisation du travail à temps partiel ne fait pas obstacle à l’acquisition de la qualification
          visée et qu’elle respecte les conditions propres au contrat de professionnalisation, notamment en matière de durée de formation par rapport à la durée totale du contrat.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default DecouvrirLAlternancePage
