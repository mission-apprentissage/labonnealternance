import type { Metadata } from "next"
import { Typography } from "@mui/material"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { Section } from "@/app/(editorial)/_components/Section"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoSection } from "@/app/(editorial)/_components/InfoSection"

export const metadata: Metadata = PAGES.static.guideAlternantCommentSignerUnContratEnAlternance.getMetadata()

const CommentSignerUnContratEnAlternancePage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantCommentSignerUnContratEnAlternance]

  const descriptionParts = [
    "Une fois que vous avez trouvé votre entreprise et votre centre de formation, il reste une étape importante : la signature du contrat. Voici ce que vous devez savoir sur les formalités administratives.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["comment-signer-un-contrat-en-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["comment-signer-un-contrat-en-alternance"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"], ARTICLES["la-rupture-de-contrat"], ARTICLES["se-faire-accompagner"]]}
    >
      <Section title="Pour un contrat d'apprentissage">
        <Paragraph>
          Votre employeur doit remplir un formulaire officiel{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/contrat-dapprentissage-services-en-ligne"
            aria-label="Consulter le formulaire Cerfa disponible sur le site du ministère du Travail"
          >
            Cerfa disponible sur le site du ministère du Travail
          </DsfrLink>
          . Ce document officialise votre contrat d'apprentissage.
        </Paragraph>
        <Paragraph component={"h3"} variant="h3">
          Les informations nécessaires
        </Paragraph>
        <Paragraph>Pour remplir ce formulaire, votre employeur aura besoin de plusieurs informations. De votre côté, préparez :</Paragraph>
        <ParagraphList
          listItems={[
            "Votre CV détaillant votre parcours scolaire et professionnel ;",
            "les informations sur votre précédent contrat d'apprentissage si vous en avez déjà effectué un ;",
            "votre carte vitale avec votre numéro de sécurité sociale (ou numéro temporaire NIA).",
          ]}
        />
        <Paragraph>Votre employeur se chargera de compléter le reste : informations sur l'entreprise, sur votre maître d'apprentissage, etc.</Paragraph>
        <Paragraph component={"h3"} variant="h3">
          La signature du contrat
        </Paragraph>
        <Paragraph>Une fois le formulaire rempli, trois signatures sont nécessaires :</Paragraph>
        <ParagraphList
          listItems={[
            "La vôtre (et celle de votre représentant légal si vous êtes mineur) ;",
            "celle de votre employeur ;",
            "le visa de votre CFA (centre de formation des apprentis).",
          ]}
        />
        <Paragraph>Le formulaire signé doit être imprimé en 2 exemplaires; l’un vous est destiné, l’autre revient à votre employeur.</Paragraph>
        <Paragraph>
          <Typography component={"span"} fontWeight={"bold"}>
            Restez vigilant :
          </Typography>
          Il arrive que certaines entreprises tardent à signer le contrat et changent d’avis au dernier moment avant la signature. Prenez vos précautions : si vous sentez que les
          délais se raccourcissent, anticipez en relançant l’entreprise et en poursuivant vos recherches d’entreprise en quête d’un plan B.
        </Paragraph>
        <Paragraph component={"h3"} variant="h3">
          Et après ?
        </Paragraph>
        <Paragraph>
          Votre employeur transmet ensuite le contrat à son OPCO (opérateur de compétences). Ces organismes peuvent demander des documents complémentaires pour vérifier que tout
          est en ordre, notamment concernant les qualifications de votre maître d'apprentissage.
        </Paragraph>
        <InfoSection>
          <Paragraph>
            <Typography component={"span"} fontWeight={"bold"}>
              À noter :
            </Typography>
            si vous signez avec une structure publique (mairie, ministère…), les démarches sont un peu différentes. Votre employeur trouvera les informations spécifiques sur{" "}
            <DsfrLink
              href="https://www.fonction-publique.gouv.fr/devenir-agent-public/lapprentissage-dans-la-fonction-publique7"
              aria-label="Consulter les informations spécifiques pour les structures publiques"
            >
              cette page
            </DsfrLink>
            .
          </Paragraph>
        </InfoSection>
      </Section>
      <Section title="Pour un contrat de professionnalisation">
        <Paragraph>
          Comme pour le contrat d'apprentissage, votre employeur doit remplir un formulaire officiel : Vous pouvez le consulter{" "}
          <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/R10338" aria-label="Consulter le formulaire officiel sur le site du ministère du Travail">
            sur le site du ministère du Travail
          </DsfrLink>{" "}
          .
        </Paragraph>
        <Paragraph component={"h3"} variant="h3">
          Les informations nécessaires
        </Paragraph>
        <Paragraph>Votre employeur aura besoin d'informations sur vous, sur le tuteur qui vous accompagnera, sur l'entreprise et sur la formation prévue.</Paragraph>
        <Paragraph component={"h3"} variant="h3">
          La signature du contrat
        </Paragraph>
        <Paragraph>
          Le formulaire doit être signé par vous et par votre employeur, puis envoyé à l'OPCO (opérateur de compétences) dont dépend votre entreprise, accompagné du programme
          détaillé de votre formation.
        </Paragraph>
        <Paragraph>Le formulaire signé doit être imprimé en 2 exemplaires; l’un vous est destiné, l’autre revient à votre employeur.</Paragraph>
        <Paragraph>
          <Typography component={"span"} fontWeight={"bold"}>
            À noter :
          </Typography>{" "}
          le contrat de professionnalisation n'existe que dans le secteur privé.
        </Paragraph>
      </Section>
      <Section title="Ce que vous devez retenir">
        <ParagraphList
          listItems={[
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Vous n'êtes pas seul :
              </Typography>{" "}
              votre employeur et votre centre de formation s'occupent de la majorité des démarches administratives
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Votre rôle principal :
              </Typography>{" "}
              préparer votre CV, lire attentivement le contrat avant de le signer, et fournir les documents demandés (pièce d'identité, attestation de sécurité sociale, etc.)
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                Le délai :
              </Typography>{" "}
              ces formalités prennent généralement quelques jours à quelques semaines. Anticipez-les pour pouvoir commencer sereinement votre alternance à la date prévue
            </>,
            <>
              <Typography component={"span"} fontWeight={"bold"}>
                En cas de doute :
              </Typography>{" "}
              n'hésitez pas à poser des questions à votre futur employeur ou à votre centre de formation. Ils sont là pour vous accompagner !
            </>,
          ]}
        />
        <Paragraph component={"h3"} variant="h3">
          Ressources du Ministère du Travail
        </Paragraph>
        <ParagraphList
          listItems={[
            <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage" aria-label="Consulter les informations sur le contrat d'apprentissage">
              Le contrat d'apprentissage
            </DsfrLink>,
            <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-de-professionnalisation" aria-label="Consulter les informations sur le contrat de professionnalisation">
              Le contrat de professionnalisation
            </DsfrLink>,
            <>
              <DsfrLink
                href="https://travail-emploi.gouv.fr/aides-aux-contrats-en-alternance-guide-pratique-destination-des-employeurs-et-des-organismes-de-formation"
                aria-label="Consulter le guide pratique à destination des employeurs et des organismes de formation sur les aides aux contrats en alternance"
              >
                Aides au contrats en alternance | Guide pratique à destination des employeurs et des organismes de formation
              </DsfrLink>
            </>,
          ]}
        />
      </Section>
    </LayoutArticle>
  )
}

export default CommentSignerUnContratEnAlternancePage
