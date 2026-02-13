import type { Metadata } from "next"
import { Typography, Grid } from "@mui/material"
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
import { QuizItem } from "@/app/(editorial)/_components/QuizItem"

export const metadata: Metadata = PAGES.static.guideAlternantAProposDesFormations.getMetadata()

const AProposDesFormationsPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantAProposDesFormations]

  const descriptionParts = [
    "De nombreuses aides existent pour faciliter votre entrée en alternance. Pensez à vous y prendre le plus tôt possible, certaines démarches pouvant prendre plusieurs semaines.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["a-propos-des-formations"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["a-propos-des-formations"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
    >
      <Section title="Vérifiez les résultats de l'établissement">
        <ParagraphList
          listItems={[
            <>
              <Typography component="span" fontWeight={"bold"}>
                Vérifiez les résultats de l'établissement :
              </Typography>{" "}
              Consultez le taux de réussite aux examens et comparez-le avec la moyenne nationale. Cela vous donnera une idée de la qualité de l'accompagnement pédagogique proposé.
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                L'insertion professionnelle, un indicateur clé :
              </Typography>{" "}
              Combien de diplômés ont trouvé un emploi dans les 6 mois ? Le site{" "}
              <DsfrLink href="https://futurpro.inserjeunes.beta.gouv.fr/" aria-label="Consulter le site Futur pro">
                Futur pro
              </DsfrLink>{" "}
              vous permet de consulter ces chiffres et de comparer les formations entre elles. C'est un bon indicateur de la pertinence de la formation.
            </>,
            <>
              <Typography component="span" fontWeight={"bold"}>
                Renseignez-vous sur votre futur métier :
              </Typography>{" "}
              Avant de vous lancer, informez-vous sur le secteur qui vous intéresse. Le réseau des Carif-Oref met à votre disposition des données sur le marché du travail et les
              perspectives d'emploi.Le réseau d'entreprises partenaires fait la différence Un établissement bien connecté avec des entreprises facilite grandement votre recherche
              d'alternance. N'hésitez pas à demander quels sont leurs partenaires.
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Le rythme d'alternance, un critère important :
              </Typography>{" "}
              2 jours en formation / 3 jours en entreprise ? 1 semaine / 1 semaine ? Assurez-vous que le rythme proposé correspond aux attentes des employeurs de votre secteur pour
              maximiser vos chances de trouver un contrat.
            </>,
            <>
              <DsfrLink href="https://www.intercariforef.org/formations/recherche-formations.html" aria-label="Consulter le site du réseau des Carif-Oref">
                Le réseau des Carif-Oref
              </DsfrLink>{" "}
              informe sur les métiers, les formations et le marché du travail pour aider les professionels et le public à s’orienter.
            </>,
          ]}
        />
      </Section>
      <Section title="Croiser les avis sur la formation qui vous intéresse">
        <ParagraphList
          listItems={[
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Contactez directement des anciens élèves via LinkedIn
              </Typography>{" "}
              pour avoir leur retour d'expérience sincère sur la formation et l'accompagnement reçu.
            </>,
            <>
              Lors des{" "}
              <Typography component="span" fontWeight={"bold"}>
                journées portes ouvertes
              </Typography>
              , posez des questions concrètes : quel accompagnement pour trouver une entreprise ? Quels sont les débouchés réels ? Y a-t-il un référent dédié aux alternants ?
            </>,
            <>
              <Typography component="span" fontWeight={"bold"}>
                Vérifiez que l'établissement est bien certifié Qualiopi
              </Typography>
              , gage de qualité des formations professionnelles.
            </>,
          ]}
        />
      </Section>
      <Section title="Rencontrez des professionnels">
        <Paragraph>
          Différentes associations ou organismes peuvent vous aider à entrer en relation avec des professionnels qui exercent les métiers auxquels vous réfléchissez :
        </Paragraph>
        <ParagraphList
          listItems={[
            <>
              <DsfrLink href="https://www.jobirl.com" aria-label="Consulter le site Jobirl">
                Jobirl
              </DsfrLink>{" "}
              vous met en relation avec des professionnels en activité qui acceptent de partager leur expérience. C'est l'occasion de découvrir concrètement un métier, de poser
              toutes vos questions et de vous constituer un réseau professionnel précieux pour votre avenir.
            </>,
            <>
              <DsfrLink href="https://www.myjobglasses.com" aria-label="Consulter le site Myjobglasses">
                Myjobglasses
              </DsfrLink>{" "}
              vous permet de rencontrer des “ambassadeurs métiers” pour vous aider à vous projeter et répondre à vos questions.
            </>,
          ]}
        />
        <Paragraph>
          Les bénéfices du mentorat sont nombreux : conseils personnalisés, boost de confiance en soi, ouverture sur le monde professionnel et parfois même accès à des opportunités
          d'emploi grâce au réseau de votre mentor.
        </Paragraph>
      </Section>
      <Section title="Vous allez rencontrer une école ? Préparer votre rendez-vous avec notre quiz :">
        <Grid
          container
          size={12}
          sx={{
            "& .fr-card__content": {
              paddingTop: fr.spacing("3w"),
              paddingBottom: fr.spacing("4w"),
            },
            "& .fr-card__title ::after": {
              display: "none",
            },
          }}
          spacing={4}
        >
          <Grid size={{ md: 12, xs: 12 }}>
            <QuizItem
              title="Vous recherchez une formation ?"
              desc="Préparez-vous à échanger avec une école"
              href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
            />
          </Grid>
        </Grid>
      </Section>
    </LayoutArticle>
  )
}

export default AProposDesFormationsPage
