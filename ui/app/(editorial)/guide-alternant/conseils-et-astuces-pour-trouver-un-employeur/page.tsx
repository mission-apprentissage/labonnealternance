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

export const metadata: Metadata = PAGES.static.guideAlternantConseilsEtAstucesPourTrouverUnEmployeur.getMetadata()

const ConseilsEtAstucesPourTrouverUnEmployeurPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantConseilsEtAstucesPourTrouverUnEmployeur]

  const descriptionParts = ["Voici quelques conseils pour décrocher votre prochain contrat :"]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["conseils-et-astuces-pour-trouver-un-employeur"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["conseils-et-astuces-pour-trouver-un-employeur"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
    >
      <Section title="Où trouver des entreprises qui recrutent ?">
        <Paragraph>
          <Typography fontWeight={"bold"}>Rendez-vous sur les salons :</Typography>
        </Paragraph>
        <Paragraph>
          <Typography>Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous !</Typography>
          <Typography>
            <DsfrLink href="https://www.letudiant.fr/etudes/salons.html" aria-label="Consulter les salons l’Étudiant">
              Voir les salons l’Étudiant
            </DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.studyrama.com/salons" aria-label="Consulter les salons Studyrama">
              Voir les salons Studyrama
            </DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://jeunesdavenirs.fr/nos-evenements/" aria-label="Consulter les salons Jeunes d’Avenirs">
              Voir les salons Jeunes d’Avenirs
            </DsfrLink>
          </Typography>
        </Paragraph>
        <Paragraph>
          France Travail recense de nombreux évènements (conférences, salons, job dating, conférences en ligne…) pour vous aider dans vos recherches de contrat.{" "}
          <DsfrLink href="https://mesevenementsemploi.francetravail.fr/mes-evenements-emploi/evenements" aria-label="Consulter les évènements France Travail">
            En savoir plus
          </DsfrLink>
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>
            Plus d’un employeur sur deux recrute sans déposer d'offre d'emploi : optimisez vos chances en adressant aussi des candidatures spontanées ! La bonne alternance
            identifie pour vous des entreprises de recruter, auprès desquelles vous pouvez adresser des candidatures spontanées.
          </Typography>
        </Paragraph>
      </Section>
      <Section title="Pour préparer vos candidatures">
        <Paragraph>
          <Typography fontWeight={"bold"}>Pour construire votre CV :</Typography>
        </Paragraph>
        <ParagraphList
          listItems={[
            <>
              Besoin d'aide pour construire un CV à partir de vos expériences ? Inscrivez-vous gratuitement sur{" "}
              <DsfrLink href="https://www.diagoriente.fr/" aria-label="Consulter le site Diagoriente">
                Diagoriente
              </DsfrLink>{" "}
              et laissez-vous guider dans la construction d'un CV pertinent, mettant en lumière vos compétences.{" "}
            </>,
            <>
              Besoin d'aide pour concevoir un beau CV ? Vous pouvez le faire gratuitement sur{" "}
              <DsfrLink href="https://cvdesignr.com/" aria-label="Consulter le site CVdesignr">
                CVdesignr
              </DsfrLink>
              .
            </>,
          ]}
        />
        <Paragraph>
          <Typography fontWeight={"bold"}>Motivation, Dynamisme et Présentation soignée : </Typography>3 qualités recherchées par les employeurs de jeunes candidats. Mettez-les en
          avant dans votre candidature !
        </Paragraph>
        <Paragraph>
          Les recruteurs font attention à de petits détails ! Professionnalisez vos candidatures{" "}
          <Typography component={"span"} fontWeight={"bold"}>
            en utilisant une adresse email adaptée aux contacts professionnels
          </Typography>{" "}
          (par exemple : nom.prenom@email.fr et en personnalisant votre messagerie vocale sur votre téléphone (par exemple : “Bonjour, vous êtes bien sur la messagerie vocale de
          [prénom+nom]. Je ne suis pas disponible pour le moment, laissez-moi un message et je vous rappellerai dès que possible. Merci !”)
        </Paragraph>
        <Paragraph>
          Les employeurs qui embauchent des alternants reçoivent des aides,{" "}
          <DsfrLink href="https://entreprendre.service-public.gouv.fr/vosdroits/F23556" aria-label="Consulter le dernier décret sur les aides aux employeurs d'alternants">
            jusqu’à 6000€ selon le dernier décret
          </DsfrLink>{" "}
          : c'est un bon argument pour convaincre une entreprise qui ne connaît pas l'alternance de vous embaucher !
        </Paragraph>
      </Section>
      <Section title="L'ANAF : le soutien par les pairs">
        <Paragraph>
          <DsfrLink href="https://www.anaf.fr/" aria-label="Consulter le site de l'ANAF">
            L'ANAF
          </DsfrLink>{" "}
          (Association Nationale des Apprentis de France) peut vous aider à tout moment de votre parcours et répondre à vos questions !
        </Paragraph>
        <Paragraph>L'ANAF est une association gérée par et pour les apprentis et alternants. Elle offre un accompagnement concret sur de nombreux aspects :</Paragraph>
        <ParagraphList
          listItems={[
            "Aide à la recherche d'entreprise et de formation ;",
            "conseils juridiques sur vos droits et devoirs en tant qu'alternant ;",
            "soutien en cas de difficultés pendant votre contrat (relations avec l'employeur, conditions de travail...) ;",
            "informations pratiques sur le logement, les aides financières, la mobilité ;",
            "mise en réseau avec d'autres alternants.",
          ]}
        />
        <Paragraph>
          Parce qu'ils sont eux-mêmes alternants ou anciens alternants, les membres de l'ANAF comprennent parfaitement les défis que vous rencontrez et peuvent vous apporter des
          réponses concrètes et adaptées à votre réalité.
        </Paragraph>
      </Section>
      <Section title="Préparez-vous à votre recherche d’entreprise avec nos quiz :">
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
          <Grid size={{ md: 6, xs: 12 }}>
            <QuizItem
              title="Vous recherchez un employeur ?"
              desc="Apprenez à bien cibler les entreprises"
              href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
            />
          </Grid>
          <Grid size={{ md: 6, xs: 12 }}>
            <QuizItem
              title="Vous avez bientôt un entretien d'embauche ?"
              desc="Entraînez-vous pour avoir plus de chances de réussite"
              href="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
            />
          </Grid>
        </Grid>
      </Section>
    </LayoutArticle>
  )
}

export default ConseilsEtAstucesPourTrouverUnEmployeurPage
