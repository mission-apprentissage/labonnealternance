import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import Button from "@codegouvfr/react-dsfr/Button"
import { Summary } from "@codegouvfr/react-dsfr/Summary"
import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { type ReactNode, Suspense } from "react"

import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { InfoSection } from "@/app/(editorial)/_components/InfoSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { Section } from "@/app/(editorial)/_components/Section"
import { TableArticle } from "@/app/(editorial)/_components/TableArticle"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES as ARTICLES_PARTAGES } from "@/app/(editorial)/guide/const"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { getDepotCtaHref } from "@/services/get-depot-cta-href"
import { getSession } from "@/utils/get-session"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
export const metadata: Metadata = METADATA.static.guideRecruteurRecruterUnAlternant()

const faqItems: { question: string; answer: string; answerNode?: ReactNode; link?: { href: string; label: string } }[] = [
  {
    question: "Quelles aides pour recruter un apprenti en 2026 ?",
    answer:
      "Pour un contrat d'apprentissage conclu depuis le 8 mars 2026 et dont l'exécution débute avant le 1er janvier 2027, l'entreprise perçoit une aide à l'embauche pouvant atteindre 5 000 € la première année. Le montant dépend de la taille de l'entreprise et du niveau du diplôme préparé : jusqu'à 5 000 € pour une entreprise de moins de 250 salariés (diplôme jusqu'au bac), et 6 000 € pour l'embauche d'un apprenti en situation de handicap, quelle que soit la taille de l'entreprise. L'aide est versée chaque mois par l'Agence de services et de paiement (ASP). Montants fixés par le décret n° 2026-168 du 6 mars 2026 (source : service-public.fr).",
  },
  {
    question: "Combien coûte un apprenti pour l'employeur ?",
    answer:
      "La rémunération légale d'un apprenti va de 27 % du SMIC (moins de 18 ans, 1re année) à 100 % du SMIC (26 ans et plus), soit d'environ 504 € à 1 867 € brut par mois sur la base du SMIC en vigueur (1 867,02 € au 1er juin 2026). Le coût réel est nettement réduit la première année grâce à l'aide à l'embauche (jusqu'à 5 000 €), et le salaire de l'apprenti est exonéré de cotisations salariales jusqu'à 50 % du SMIC (933,51 € au 1er juin 2026). Pour une estimation précise du coût net, utilisez le simulateur de l'URSSAF.",
    link: {
      href: "https://www.urssaf.fr/accueil/outils-documentation/simulateurs/cotisations-employeur.html",
      label: "Simulateur de coût employeur de l'URSSAF",
    },
  },
  {
    question: "Quelles conditions pour embaucher un apprenti ?",
    answer:
      "Toute entreprise du secteur privé, association ou employeur public peut recruter un apprenti. L'apprenti doit avoir entre 16 et 29 ans révolus (dès 15 ans si la classe de 3e est achevée, sans limite d'âge pour les personnes reconnues en situation de handicap, les sportifs de haut niveau et les porteurs d'un projet de création ou reprise d'entreprise). L'employeur doit désigner un maître d'apprentissage justifiant de la qualification et de l'expérience requises.",
  },
  {
    question: "Comment recruter un apprenti, étape par étape ?",
    answer:
      "1. Définissez le poste et le diplôme préparé. 2. Désignez un maître d'apprentissage. 3. Trouvez un candidat — vous pouvez déposer gratuitement votre offre sur La bonne alternance. 4. Rapprochez-vous du centre de formation qui préparera l'apprenti. 5. Signez le contrat d'apprentissage (Cerfa FA13) ou de professionnalisation ; votre OPCO peut vous accompagner dans cette démarche. 6. Transmettez le contrat à votre OPCO au plus tard dans les 5 jours ouvrables suivant le début du contrat. L'OPCO instruit le dossier et prend en charge les frais de formation.",
    answerNode: (
      <ParagraphList
        ordered
        listItems={[
          "Définissez le poste et le diplôme préparé.",
          "Désignez un maître d'apprentissage.",
          <>
            Trouvez un candidat — vous pouvez{" "}
            <DsfrLink
              href={`${PAGES.static.espaceProCreationEntreprise.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_recruteur`}
              aria-label="Déposer gratuitement une offre d'alternance sur La bonne alternance"
            >
              déposer gratuitement votre offre sur La bonne alternance
            </DsfrLink>
            .
          </>,
          "Rapprochez-vous du centre de formation qui préparera l'apprenti.",
          "Signez le contrat d'apprentissage (Cerfa FA13) ou de professionnalisation ; votre OPCO peut vous accompagner dans cette démarche.",
          "Transmettez le contrat à votre OPCO au plus tard dans les 5 jours ouvrables suivant le début du contrat. L'OPCO instruit le dossier et prend en charge les frais de formation.",
        ]}
      />
    ),
  },
  {
    question: "Quand faut-il recruter un apprenti pour la rentrée ?",
    answer:
      "Les recrutements en alternance se concentrent entre juin et novembre, autour de la rentrée de septembre-octobre, mais vous pouvez recruter toute l'année : le contrat d'apprentissage peut débuter jusqu'à 3 mois avant ou après le début du cycle de formation. Pour sécuriser l'aide à l'embauche 2026, le contrat doit être conclu depuis le 8 mars 2026 et son exécution débuter avant le 1er janvier 2027 : mieux vaut donc anticiper votre recrutement de rentrée.",
  },
  {
    question: "Où trouver un candidat en alternance ?",
    answer:
      "La bonne alternance, le service public de l'alternance, vous permet de déposer gratuitement votre offre. Elle est notamment diffusée sur La bonne alternance, Hellowork et Parcoursup, et vous recevez directement les candidatures. Vous pouvez aussi être contacté par des candidats en recherche d'alternance, y compris en candidature spontanée.",
  },
  {
    question: "Combien coûte le dépôt d'une offre d'alternance sur La bonne alternance ?",
    answer:
      "Le dépôt d'une offre d'alternance sur La bonne alternance est entièrement gratuit. C'est un service public opéré par la Délégation générale à l'emploi et à la formation professionnelle (DGEFP) du ministère du Travail et de l'Emploi.",
  },
  {
    question: "Peut-on rompre un contrat d'apprentissage ?",
    answer:
      "Oui. Pendant les 45 premiers jours, consécutifs ou non, de formation pratique en entreprise, l'employeur comme l'apprenti peuvent rompre le contrat librement, par écrit. Passé ce délai, la rupture nécessite un accord écrit des deux parties, ou peut être prononcée par le conseil de prud'hommes (faute grave, inaptitude, force majeure). L'apprenti qui obtient son diplôme peut aussi mettre fin au contrat avant son terme, en respectant un préavis.",
  },
  {
    question: "Quelle est la différence entre contrat d'apprentissage et contrat de professionnalisation ?",
    answer:
      "Les deux contrats alternent formation et travail en entreprise. Le contrat d'apprentissage vise principalement les 16-29 ans et mène à un diplôme reconnu par l'État (CAP, BTS, Licence Pro, Master…). Le contrat de professionnalisation, ouvert plus largement, vise une qualification professionnelle (titre RNCP, certification). L'aide à l'embauche de 5 000 € concerne le contrat d'apprentissage.",
  },
]

async function DepotOffreCtaButton() {
  const { user } = await getSession()
  const href = `${getDepotCtaHref(user, "ENTREPRISE")}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_recruteur`
  return (
    <Box>
      <Button linkProps={{ href }} priority="primary" size="large">
        Déposer une offre gratuitement
      </Button>
    </Box>
  )
}

const RecruterUnAlternantPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurRecruterUnAlternant]
  const page = PAGES.static.guideRecruteurRecruterUnAlternant

  const descriptionParts = [
    "Recruter un apprenti, c'est former un futur collaborateur tout en bénéficiant d'une aide à l'embauche pouvant atteindre 5 000 € la première année.",
    "Aides à l'embauche 2026, coût réel d'un apprenti, conditions et démarches pas à pas : voici tout ce qu'un employeur doit savoir pour recruter en alternance. La bonne alternance, le service public de l'alternance, vous permet de déposer votre offre gratuitement et de recevoir directement les candidatures.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title="Recruter un apprenti : aides à l'embauche, coût et démarches"
      updatedAt={<UpdatedAtSection date={ARTICLES["recruter-un-alternant"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      redirectionInterne={<RedirectionInterne source="guide-recruteur" />}
      allerPlusLoinItems={[ARTICLES["cerfa-apprentissage-et-professionnalisation"], ARTICLES["je-suis-employeur-public"], ARTICLES_PARTAGES["decouvrir-l-alternance"]]}
      sourceAllerPlusLoin="guide-recruteur"
      parentPage={PAGES.static.guideRecruteur}
      page={page}
      metadata={metadata}
    >
      <SchemaOrg
        type="FAQPage"
        title="Questions fréquentes des employeurs sur le recrutement d'un apprenti"
        description="Aides à l'embauche, coût, conditions et démarches pour recruter un apprenti en 2026."
        url={page.getPath()}
        breadcrumbs={[
          { name: PAGES.static.home.title, url: PAGES.static.home.getPath() },
          { name: PAGES.static.guideRecruteur.title, url: PAGES.static.guideRecruteur.getPath() },
          { name: page.title, url: page.getPath() },
        ]}
        faqItems={faqItems}
        omitBreadcrumb
      />

      <Suspense fallback={<Box sx={{ height: 48 }} />}>
        <DepotOffreCtaButton />
      </Suspense>

      <Summary
        links={[
          { text: "Aides à l'embauche 2026", linkProps: { href: "#aides" } },
          { text: "Conditions pour recruter un apprenti", linkProps: { href: "#conditions" } },
          { text: "Coût réel d'un apprenti", linkProps: { href: "#cout-reel" } },
          { text: "Comment recruter un apprenti : les étapes", linkProps: { href: "#comment-recruter" } },
          { text: "Où trouver un candidat", linkProps: { href: "#trouver-un-candidat" } },
          { text: "Questions fréquentes des employeurs", linkProps: { href: "#faq" } },
        ]}
      />

      <Section id="aides" title="Aides à l'embauche d'un apprenti en 2026">
        <Paragraph>
          L'aide financière proposée par le gouvernement à l'embauche d'un apprenti a vocation à soutenir le recours à ce mode de formation insérant. Elle concerne les contrats
          d'apprentissage conclus <strong>depuis le 8 mars 2026</strong> et dont l'exécution débute <strong>avant le 1er janvier 2027</strong> : l'entreprise perçoit alors une aide
          versée chaque mois par l'Agence de services et de paiement (ASP) pendant la première année du contrat. Son montant dépend de la taille de l'entreprise et du niveau du
          diplôme préparé par l'apprenti.
        </Paragraph>
        <TableArticle
          caption="Montant de l'aide à l'embauche d'un apprenti (contrats conclus depuis le 8 mars 2026)"
          headers={["Taille de l'entreprise", "Niveau du diplôme préparé", "Montant de l'aide (1re année)"]}
          data={[
            ["Moins de 250 salariés", "CAP à Bac (niveaux 3 et 4)", "5 000 €"],
            ["Moins de 250 salariés", "Bac+2 (niveau 5)", "4 500 €"],
            ["Moins de 250 salariés", "Bac+3 à Master (niveaux 6 et 7)", "2 000 €"],
            ["250 salariés et plus", "CAP à Bac (niveaux 3 et 4)", "2 000 €"],
            ["250 salariés et plus", "Bac+2 (niveau 5)", "1 500 €"],
            ["250 salariés et plus", "Bac+3 à Master (niveaux 6 et 7)", "750 €"],
            ["Toutes tailles", "Apprenti en situation de handicap", "6 000 €"],
          ]}
        />
        <Paragraph variant="body2" color={fr.colors.decisions.text.mention.grey.default}>
          Montants fixés par le décret n° 2026-168 du 6 mars 2026, pour les contrats d'apprentissage conclus depuis le 8 mars 2026 et dont l'exécution débute avant le 1er janvier
          2027. Aide versée par l'ASP la première année du contrat. Pour les entreprises de 250 salariés et plus, l'aide est soumise à une condition d'effectif d'apprentis et n'est
          pas cumulable avec l'aide unique. L'aide « apprenti en situation de handicap » est cumulable avec les aides spécifiques de l'AGEFIPH. Voir aussi{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/laide-aux-employeurs-qui-recrutent-en-apprentissage"
            size="sm"
            aria-label="Consulter l'aide aux employeurs qui recrutent en apprentissage sur le site du ministère du Travail"
          >
            l'aide aux employeurs qui recrutent en apprentissage
          </DsfrLink>
          .
        </Paragraph>
        <InfoSection>
          <Paragraph>
            Ces montants sont fixés par décret et actualisés chaque année. Pour les montants en vigueur, référez-vous au{" "}
            <DsfrLink
              href="https://travail-emploi.gouv.fr/aides-aux-contrats-en-alternance-guide-pratique-destination-des-employeurs-et-des-organismes-de-formation"
              aria-label="Consulter le guide des aides aux contrats en alternance du ministère du Travail"
            >
              guide des aides aux contrats en alternance du ministère du Travail
            </DsfrLink>
            , qui détaille et actualise ces informations.
          </Paragraph>
        </InfoSection>
      </Section>

      <Section id="conditions" title="Conditions pour recruter un apprenti">
        <Paragraph>
          <strong>Quel employeur ?</strong> Toute entreprise du secteur privé, association, profession libérale ou employeur public peut recruter un apprenti. Aucune condition de
          taille ni d'ancienneté n'est requise.
        </Paragraph>
        <Paragraph>
          <strong>Quel âge pour l'apprenti ?</strong> Le contrat d'apprentissage s'adresse aux jeunes de 16 à 29 ans révolus. Il est accessible dès 15 ans si la classe de 3e est
          achevée, et sans limite d'âge pour les personnes reconnues en situation de handicap (RQTH), les sportifs de haut niveau et les porteurs d'un projet de création ou de
          reprise d'entreprise nécessitant le diplôme préparé.
        </Paragraph>
        <Paragraph>
          <strong>Quel encadrement ?</strong> L'employeur doit désigner un <strong>maître d'apprentissage</strong>, salarié volontaire justifiant de la qualification et de
          l'expérience nécessaires, chargé d'accompagner l'apprenti et de faire le lien avec le centre de formation (CFA).
        </Paragraph>
      </Section>

      <Section id="cout-reel" title="Coût réel d'un apprenti pour l'employeur">
        <Paragraph>
          La rémunération légale d'un apprenti est un pourcentage du SMIC, qui augmente avec l'âge et l'année de formation. L'aide à l'embauche et les exonérations de cotisations
          réduisent le coût réel supporté par l'entreprise.
        </Paragraph>
        <TableArticle
          caption="Rémunération mensuelle brute minimale d'un apprenti selon l'âge et l'année de formation (en % du SMIC)"
          headers={["Âge de l'apprenti", "1re année", "2e année", "3e année"]}
          data={[
            ["Moins de 18 ans", "27 % — 504 €", "39 % — 728 €", "55 % — 1 027 €"],
            ["18 à 20 ans", "43 % — 803 €", "51 % — 952 €", "67 % — 1 251 €"],
            ["21 à 25 ans", "53 % — 990 €", "61 % — 1 139 €", "78 % — 1 456 €"],
            ["26 ans et plus", "100 % — 1 867 €", "100 % — 1 867 €", "100 % — 1 867 €"],
          ]}
        />
        <Paragraph variant="body2" color={fr.colors.decisions.text.mention.grey.default}>
          Pourcentages du SMIC en vigueur (1 867,02 € brut/mois au 1er juin 2026). Pour les 21 ans et plus, la rémunération peut être relevée au SMIC ou au minimum conventionnel
          lorsqu'il est plus favorable. Source :{" "}
          <DsfrLink href="https://www.service-public.fr/particuliers/vosdroits/F2918" size="sm" aria-label="Consulter la rémunération d'un apprenti sur service-public.fr">
            service-public.fr
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph>
          Le <strong>coût réel</strong> est inférieur à ce salaire brut : la première année, l'aide à l'embauche (jusqu'à 5 000 €) vient en déduction, et la rémunération de
          l'apprenti est exonérée de cotisations salariales jusqu'à 50 % du SMIC (soit 933,51 € au 1er juin 2026), si bien que le salaire net reste proche du brut sous ce seuil.
          Pour estimer précisément le reste à charge, utilisez le{" "}
          <DsfrLink
            href="https://www.urssaf.fr/accueil/outils-documentation/simulateurs/cotisations-employeur.html"
            aria-label="Consulter le simulateur de coût employeur de l'URSSAF"
          >
            simulateur employeur de l'URSSAF
          </DsfrLink>{" "}
          ou notre{" "}
          <DsfrLink href={PAGES.static.salaireAlternant.getPath()} aria-label="Accéder au simulateur de salaire en alternance">
            simulateur de salaire en alternance
          </DsfrLink>
          .
        </Paragraph>
      </Section>

      <Section id="comment-recruter" title="Comment recruter un apprenti : les étapes">
        <Paragraph>De la définition du poste à la transmission du contrat à l'OPCO, voici le parcours complet pour recruter un apprenti.</Paragraph>
        <ParagraphList
          ordered
          listItems={[
            <>
              <strong>Définissez le poste et le diplôme préparé</strong> : missions confiées à l'apprenti et niveau de formation visé.
            </>,
            <>
              <strong>Désignez un maître d'apprentissage</strong> pour encadrer l'apprenti en entreprise.
            </>,
            <>
              <strong>Trouvez un candidat</strong> :{" "}
              <DsfrLink
                href={`${PAGES.static.espaceProCreationEntreprise.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_recruteur`}
                aria-label="Déposer gratuitement une offre d'alternance sur La bonne alternance"
              >
                déposez gratuitement votre offre sur La bonne alternance
              </DsfrLink>{" "}
              pour recevoir des candidatures ciblées.
            </>,
            <>
              <strong>Rapprochez-vous du centre de formation</strong> qui préparera l'apprenti au diplôme.
            </>,
            <>
              <strong>Signez le contrat</strong> d'apprentissage (Cerfa FA13) ou de professionnalisation avec l'apprenti et le centre de formation. Votre OPCO peut vous accompagner
              dans cette démarche —{" "}
              <DsfrLink href="https://quel-est-mon-opco.francecompetences.fr/" aria-label="Trouver mon OPCO sur le site de France compétences">
                trouver mon OPCO
              </DsfrLink>
              .
            </>,
            <>
              <strong>Transmettez le contrat à votre OPCO</strong> au plus tard dans les 5 jours ouvrables suivant le début du contrat. L'OPCO instruit le dossier et prend en
              charge les frais de formation.
            </>,
          ]}
        />
        <Paragraph>
          Pour aller plus loin, consultez notre{" "}
          <DsfrLink href={PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getPath()} aria-label="Consulter le guide du Cerfa d'apprentissage">
            guide du Cerfa d'apprentissage et de professionnalisation
          </DsfrLink>
          .
        </Paragraph>
      </Section>

      <Section id="trouver-un-candidat" title="Où trouver un candidat en alternance ?">
        <Paragraph>
          Le dépôt d'une offre sur La bonne alternance est <strong>entièrement gratuit</strong>. Votre offre est notamment diffusée sur La bonne alternance, Hellowork et
          Parcoursup, et vous pouvez aussi être contacté par des candidats en recherche d'alternance, y compris en candidature spontanée.
        </Paragraph>
        <Suspense fallback={<Box sx={{ height: 48 }} />}>
          <DepotOffreCtaButton />
        </Suspense>
      </Section>

      <Section id="faq" title="Questions fréquentes des employeurs">
        <Box>
          {faqItems.map((item, idx) => (
            <Accordion key={item.question} label={item.question} defaultExpanded={idx === 0}>
              {item.answerNode ?? (
                <Typography>
                  {item.answer}
                  {item.link ? (
                    <>
                      {" "}
                      <DsfrLink href={item.link.href} aria-label={item.link.label}>
                        {item.link.label}
                      </DsfrLink>
                    </>
                  ) : null}
                </Typography>
              )}
            </Accordion>
          ))}
        </Box>
      </Section>
    </LayoutArticle>
  )
}

export default RecruterUnAlternantPage
