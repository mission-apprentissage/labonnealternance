import type { Metadata } from "next"
import { Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { Section } from "@/app/(editorial)/_components/Section"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const metadata: Metadata = PAGES.static.guideAlternantSeFaireAccompagner.getMetadata()

const SeFaireAccompagnerPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantSeFaireAccompagner]

  const descriptionParts = [
    "Trouver une alternance peut parfois ressembler à un parcours du combattant : rédaction de CV, lettres de motivation, recherche d'entreprises, préparation aux entretiens... Bonne nouvelle : vous n'êtes pas seul ! De nombreuses structures et dispositifs existent pour vous accompagner à chaque étape de votre parcours.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["se-faire-accompagner"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["se-faire-accompagner"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[
        ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"],
        ARTICLES["comment-signer-un-contrat-en-alternance"],
        ARTICLES["la-rupture-de-contrat"],
      ]}
    >
      <Section title="Pourquoi se faire accompagner ?">
        <Paragraph>
          Solliciter de l'aide dans sa recherche d'alternance n'est pas un signe de faiblesse, bien au contraire. C'est faire preuve de bon sens et d'efficacité. Un accompagnement
          adapté vous permet de :
        </Paragraph>
        <ParagraphList
          listItems={[
            "Gagner du temps dans vos recherches et vos démarches ;",
            "éviter les erreurs courantes qui peuvent pénaliser votre candidature ;",
            "bénéficier de conseils personnalisés adaptés à votre situation ;",
            "accéder à un réseau d'entreprises et d'opportunités ;",
            "rester motivé même face aux refus ;",
            "développer des compétences utiles pour toute votre vie professionnelle.",
          ]}
        />
        <Paragraph>
          Faire appel à des professionnels ou à des personnes expérimentées, c'est multiplier vos chances de décrocher l'alternance qui vous correspond vraiment.
        </Paragraph>
      </Section>
      <Section title="Les Missions locales : votre premier point de contact">
        <Paragraph>
          Contactez la{" "}
          <DsfrLink href="https://www.missions-locales.org/" aria-label="Consulter le site des Missions locales">
            Mission locale
          </DsfrLink>{" "}
          de votre secteur. Des conseillers vous aideront dans vos recherches d'entreprise.{" "}
          <DsfrLink href="https://www.missions-locales.org/" aria-label="Trouver ma mission locale">
            Trouver ma mission locale.
          </DsfrLink>
        </Paragraph>
        <Paragraph>
          Les Missions locales accompagnent les jeunes de 16 à 25 ans dans leur insertion professionnelle. Leurs conseillers sont des experts de l'emploi et de la formation sur
          votre territoire. Ils peuvent vous aider à :
        </Paragraph>
        <ParagraphList
          listItems={[
            "Affiner votre projet professionnel ;",
            "construire vos outils de candidature (CV, lettre de motivation) ;",
            "identifier les entreprises qui recrutent près de chez vous ;",
            "vous préparer aux entretiens d'embauche ;",
            "résoudre d'éventuels freins à votre insertion (mobilité, logement, santé...).",
          ]}
        />
        <Paragraph>
          L'avantage majeur des Missions locales ? Elles connaissent parfaitement le tissu économique local et entretiennent des relations directes avec les employeurs de votre
          région. N'hésitez pas à prendre rendez-vous dès le début de vos recherches.
        </Paragraph>
      </Section>
      <Section title="Les cellules régionales interministérielles d'accompagnement">
        <Paragraph>
          Les cellules régionales interministérielles d’accompagnement vers l’apprentissage fournissent un appui renforcé aux jeunes candidats à l'apprentissage qui rencontrent des
          difficultés pour trouver une formation ou un employeur. Leurs actions viennent en complémentarité de l'action des CFA dans ce domaine.
        </Paragraph>
        <Paragraph>
          Organisées sous la responsabilité du préfet de région, les cellules régionales interministérielles d'accompagnement réunissent les acteurs de l'écosystème régional en
          matière d'apprentissage (OPCO, Carif-Oref, service public de l'emploi, conseil régional, chambres consulaires, rectorat de région académique, etc.).
        </Paragraph>
        <Paragraph>
          Ces cellules, arrivent en complémentarité de l'action des CFA, en accompagnant les candidats à l'apprentissage qui rencontrent des difficultés pour trouver une formation
          ou un employeur.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>À noter : </Typography> le jeune peut débuter sa formation sans contrat d'apprentissage. Toutefois, il aura un délai de 3 mois pour
          trouver un employeur. Ce délai débute à la date du début de sa formation. Elles peuvent également intervenir pour aider les jeunes à trouver un nouvel employeur à la
          suite d'une rupture de contrat.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Comment les contacter ?
        </Paragraph>
        <Paragraph>
          Les jeunes à la recherche d'un contrat d'apprentissage ou d'une formation en apprentissage peuvent contacter directement les cellules, via un formulaire Démarches
          simplifiées ou une adresse mail, via les liens ci-dessous.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>À noter : </Typography> les jeunes déjà inscrits en CFA doivent les solliciter en priorité, les CFA ayant pour mission d’accompagner les
          jeunes dans la recherche de contrat d’apprentissage.
        </Paragraph>
        <ParagraphList
          listItems={[
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/cellule-apprentissage-ara" aria-label="Contacter la cellule apprentissage Auvergne-Rhône-Alpes">
              Auvergne-Rhône-Alpes
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-bfc-appui-aux-apprentis"
              aria-label="Contacter la cellule apprentissage Bourgogne-Franche-Comté"
            >
              Bourgogne-Franche-Comté
            </DsfrLink>,
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-interministerielle-en-bretagne" aria-label="Contacter la cellule apprentissage Bretagne">
              Bretagne
            </DsfrLink>,
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/candidature-label-orientation-cvl" aria-label="Contacter la cellule apprentissage Centre-Val de Loire">
              Centre-Val de Loire
            </DsfrLink>,
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-interministerielle-pour-l-appren" aria-label="Contacter la cellule apprentissage Corse">
              Corse
            </DsfrLink>,
            <DsfrLink href="https://www.orientest.fr/contact" aria-label="Contacter la cellule apprentissage Grand Est">
              Grand Est
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/dreets-hdf-cellule-regionale-interministerielle-a-"
              aria-label="Contacter la cellule apprentissage Hauts-de-France"
            >
              Hauts-de-France
            </DsfrLink>,
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-apprentissage-iledefrance" aria-label="Contacter la cellule apprentissage Île-de-France">
              Île-de-France
            </DsfrLink>,
            <DsfrLink href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-apprentissage-normandie" aria-label="Contacter la cellule apprentissage Normandie">
              Normandie
            </DsfrLink>,
            <DsfrLink href="mailto:dreets-na.cellule-apprentissage@dreets.gouv.fr" aria-label="Contacter la cellule apprentissage Nouvelle-Aquitaine">
              Nouvelle-Aquitaine
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-interministerielle-region-occita"
              aria-label="Contacter la cellule apprentissage Occitanie"
            >
              Occitanie
            </DsfrLink>,
            <DsfrLink href="mailto:dreets-pdl.apprentissage@dreets.gouv.fr" aria-label="Contacter la cellule apprentissage Pays de la Loire">
              Pays de la Loire
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-interministerielle-region-occita"
              aria-label="Contacter la cellule apprentissage Provence-Alpes-Côte d'Azur (PACA)"
            >
              Provence-Alpes-Côte d'Azur (PACA)
            </DsfrLink>,
            <DsfrLink href="mailto:974.apprentissage@dreets.gouv.fr" aria-label="Contacter la cellule apprentissage de la réunion">
              La réunion
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-apprentissage-guadeloupe-idn"
              aria-label="Contacter la cellule apprentissage Guadeloupe/Saint-Martin/Saint-Barthélemy"
            >
              Guadeloupe/Saint-Martin/Saint-Barthélemy
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-d-accompagnement-vers-l-apprentissage-mart"
              aria-label="Contacter la cellule apprentissage Martinique"
            >
              Martinique
            </DsfrLink>,
            <DsfrLink
              href="https://demarche.numerique.gouv.fr/commencer/cellule-regionale-interministerielle-a-l-apprentis"
              aria-label="Contacter la cellule apprentissage Mayotte"
            >
              Mayotte
            </DsfrLink>,
          ]}
        />
      </Section>
      <Section title="Le mentorat : apprendre de l'expérience des autres">
        <Paragraph>
          Un mentor (ancien alternant ou adulte actif inséré dans la vie professionnelle) peut vous épauler tout au long de votre parcours et suivant vos besoins !
        </Paragraph>
        <Paragraph>Le mentorat consiste à être accompagné par une personne plus expérimentée qui partage ses conseils, son réseau et son vécu professionnel.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          1 jeune 1 solution : un accompagnement de proximité
        </Paragraph>
        <Paragraph>
          Profitez d'un accompagnement proche de chez vous pour votre parcours et vos démarches avec{" "}
          <DsfrLink href="https://www.1jeune1solution.gouv.fr/">1jeune1solution</DsfrLink>.
        </Paragraph>
        <Paragraph>Porté par le gouvernement, le dispositif 1 jeune 1 solution centralise de nombreuses aides et services dédiés aux jeunes avec notamment :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              La possibilité d’échanger avec un mentor avec{" "}
              <DsfrLink href="https://www.1jeune1mentor.fr/" aria-label="Consulter le service 1jeune1mentor">
                1jeune1mentor
              </DsfrLink>{" "}
              et son réseau d’associations ;
            </>,
            "la mise en relation avec des conseillers près de chez vous (France Travail, Missions locales, Info jeune) ;",
            "des ateliers et événements de recrutement.",
          ]}
        />
        <Paragraph>
          La plateforme 1jeune1solution{" "}
          <DsfrLink href="https://www.1jeune1solution.gouv.fr/accompagnement" aria-label="Consulter le service 1jeune1solution">
            vous oriente vers les bons interlocuteurs
          </DsfrLink>{" "}
          selon votre situation et votre localisation. C'est un guichet unique qui simplifie vos démarches et vous fait gagner un temps précieux.
        </Paragraph>
      </Section>
      <Section title="Nos conseils pour bien profiter de ces accompagnements">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          1. N'attendez pas d'être en difficulté
        </Paragraph>
        <Paragraph>Sollicitez de l'aide dès le début de vos recherches. L'accompagnement est encore plus efficace en prévention qu'en résolution de problèmes.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          2. Soyez proactif et régulier
        </Paragraph>
        <Paragraph>
          Prenez vos rendez-vous, préparez vos questions, donnez des nouvelles à vos conseillers. Plus vous serez impliqué, plus l'accompagnement sera fructueux.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          3. Cumulez les soutiens
        </Paragraph>
        <Paragraph>
          Vous pouvez tout à fait bénéficier de plusieurs accompagnements simultanément. Chaque structure a ses spécificités et peut vous apporter un éclairage différent.{" "}
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          4. N'ayez pas peur de poser des questions
        </Paragraph>
        <Paragraph>Il n'y a pas de question bête. Les structures d'accompagnement sont là pour répondre à toutes vos interrogations, même les plus basiques. </Paragraph>
      </Section>
      <Section title="Vous n'êtes jamais seul">
        <Paragraph>
          La recherche d'alternance peut s’avérer difficile, mais il ne faut pas se décourager. Il est normal de rencontrer des obstacles, de douter parfois, de recevoir des refus.
          C'est précisément pour ces moments que les structures d'accompagnement existent.
        </Paragraph>
        <Paragraph>
          Franchissez le pas et prenez contact avec ces structures. Votre alternance idéale est peut-être à portée de main, avec le bon accompagnement pour la décrocher !
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default SeFaireAccompagnerPage
