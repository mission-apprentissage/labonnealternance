import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, List, ListItem, Typography } from "@mui/material"
import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { Section } from "@/app/(editorial)/_components/Section"
import { TableArticle } from "@/app/(editorial)/_components/TableArticle"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantComprendreLaRemuneration.getMetadata()

const BlocSalaire = () => (
  <Grid container spacing={fr.spacing("4v")} mb={fr.spacing("4v")}>
    <Grid
      size={{ md: 3, xs: 12 }}
      sx={{
        backgroundColor: "white",
        padding: fr.spacing("7v"),
        borderRadius: "5px",
        boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
      }}
    >
      <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
        Moins de 18 ans
      </Typography>
      <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            27%
          </Typography>{" "}
          la 1re année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            39%
          </Typography>{" "}
          la 2e année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            55%
          </Typography>{" "}
          la 3e année
        </ListItem>
      </List>
    </Grid>
    <Grid
      size={{ md: 3, xs: 12 }}
      sx={{
        backgroundColor: "white",
        padding: fr.spacing("7v"),
        borderRadius: "5px",
        boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
      }}
    >
      <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
        18 à 20 ans
      </Typography>
      <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            43%
          </Typography>{" "}
          la 1re année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            51%
          </Typography>{" "}
          la 2e année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            60%
          </Typography>{" "}
          la 3e année
        </ListItem>
      </List>
    </Grid>
    <Grid
      size={{ md: 3, xs: 12 }}
      sx={{
        backgroundColor: "white",
        padding: fr.spacing("7v"),
        borderRadius: "5px",
        boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
      }}
    >
      <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
        21 à 25 ans
      </Typography>
      <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            53%
          </Typography>{" "}
          la 1re année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            61%
          </Typography>{" "}
          la 2e année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            78%
          </Typography>{" "}
          la 3e année
        </ListItem>
      </List>
    </Grid>
    <Grid
      size={{ md: 3, xs: 12 }}
      sx={{
        backgroundColor: "white",
        padding: fr.spacing("7v"),
        borderRadius: "5px",
        boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
      }}
    >
      <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
        26 ans et plus
      </Typography>
      <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            100%
          </Typography>{" "}
          la 1re année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            100%
          </Typography>{" "}
          la 2e année
        </ListItem>
        <ListItem>
          <Typography component={"span"} fontWeight={"bold"}>
            100%
          </Typography>{" "}
          la 3e année
        </ListItem>
      </List>
    </Grid>
  </Grid>
)

const ComprendreLaRemunerationPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantComprendreLaRemuneration]

  const descriptionParts = [
    "Vous vous lancez dans l'alternance et vous vous demandez combien vous allez gagner ? La rémunération en alternance dépend de plusieurs facteurs : le type de contrat (apprentissage ou professionnalisation), votre âge, votre année de formation et parfois votre niveau de diplôme. Ce guide complet vous présente tous les barèmes de salaire en vigueur en 2026.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["comprendre-la-remuneration"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["comprendre-la-remuneration"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      redirectionInterne={<RedirectionInterne />}
      allerPlusLoinItems={[
        ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"],
        ARTICLES["comment-signer-un-contrat-en-alternance"],
        ARTICLES["la-rupture-de-contrat"],
      ]}
      parentPage={PAGES.static.guideAlternant}
      page={PAGES.static.guideAlternantComprendreLaRemuneration}
    >
      <Section title="Comprendre la rémunération en alternance">
        <Paragraph>La rémunération minimale en alternance diffère selon le contrat choisi. Deux types de contrats existent :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <DsfrLink href={"https://travail-emploi.gouv.fr/le-contrat-dapprentissage"} aria-label="En savoir plus sur le contrat d'apprentissage">
                Le contrat d'apprentissage
              </DsfrLink>
              , destiné aux jeunes de 16 à 29 ans révolus, ou sans limite d'âge pour les travailleurs handicapés, sportifs de haut niveau et porteurs de projet de création
              d'entreprise. La rémunération est calculée en pourcentage du SMIC selon l'âge et l'année d'exécution du contrat (
              <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038033238/" aria-label="Consulter l'article D. 6222-26 du Code du travail – Légifrance">
                article D. 6222-26 du Code du travail – Légifrance
              </DsfrLink>
              ).
            </>,
            <>
              <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-de-professionnalisation" aria-label="En savoir plus sur le contrat de professionnalisation">
                Le contrat de professionnalisation
              </DsfrLink>
              , ouvert aux jeunes de 16 à 25 ans révolus souhaitant compléter leur formation initiale et aux demandeurs d'emploi de 26 ans et plus. La rémunération varie selon
              l'âge et le niveau de qualification initial (
              <DsfrLink
                href="https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000018498338/"
                aria-label="Consulter les articles L. 6325-1 à L. 6325-3 du Code du travail – Légifrance"
              >
                articles L. 6325-1 à L. 6325-3 du Code du travail – Légifrance
              </DsfrLink>
              ).
            </>,
          ]}
        />
        <Paragraph>
          Dans les deux cas, le salaire est calculé en pourcentage du SMIC ou, pour les 21 ans et plus, du salaire minimum conventionnel (SMC) de l'emploi occupé lorsque celui-ci
          est plus favorable.
        </Paragraph>
      </Section>
      <Section title={"Salaire en contrat d'apprentissage en 2026"}>
        <Paragraph>
          Le contrat d'apprentissage offre une rémunération progressive qui évolue avec l'âge de l'apprenti et son ancienneté dans le contrat. La rémunération minimale s'élève à 27
          % du SMIC pour les apprentis de moins de 18 ans en première année.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Salaire en contrat d'apprentissage en 2026
        </Paragraph>
        <Paragraph>
          Le salaire de référence dans le tableau ci-dessous est le minimum réglementaire en vigueur au jour de la simulation. Certaines conventions collectives peuvent prévoir un
          revenu minimum plus élevé pour l’alternant. L'employeur reste libre de proposer un salaire supérieur à celui-ci. Le montant de la rémunération change au fur et à mesure
          de l’avancée dans le contrat selon les critères de la grille.
        </Paragraph>
        <BlocSalaire />
        <Paragraph>
          *ou du salaire minimum conventionnel (SMC) de l'emploi occupé si celui-ci est plus favorable (
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038033238/" aria-label="Consulter l'article D. 6222-26 du Code du travail – Légifrance">
            article D. 6222-26 du Code du travail – Légifrance
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Salaire selon le diplôme préparé en apprentissage
        </Paragraph>
        <Paragraph>
          La durée de la formation et donc le nombre d'années de contrat varient selon le diplôme préparé. Voici les rémunérations types selon les parcours les plus courants,
          calculées à partir des pourcentages fixés par l'
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038033238/" aria-label="Consulter l'article D. 6222-26 du Code du travail – Légifrance">
            article D. 6222-26 du Code du travail – Légifrance
          </DsfrLink>
          .
        </Paragraph>
        <Paragraph component={"h4"} variant={"h4"} fontWeight={"bold"}>
          Cas particulier du salaire d'un apprenti en Licence professionnelle
        </Paragraph>
        <Paragraph>
          Une licence professionnelle en apprentissage se prépare en 1 an après un Bac+2. L'apprenti a généralement 20 ou 21 ans. La rémunération minimale correspond à celle fixée
          pour la deuxième année d'exécution du contrat (
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041770366" aria-label="Consulter l'article D. 6222-32 du Code du travail – Légifrance">
            article D. 6222-32 du Code du travail – Légifrance
          </DsfrLink>{" "}
          ;{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/questions-reponses-la-formation-en-alternance"
            aria-label="Consulter le site travail-emploi.gouv.fr – Questions-réponses sur la rémunération des apprentis"
          >
            travail-emploi.gouv.fr – Questions-réponses sur la rémunération des apprentis
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph component={"h4"} variant={"h4"} fontWeight={"bold"}>
          Cas de majoration du salaire d'un apprenti non pris en compte dans le simulateur
        </Paragraph>
        <Paragraph>
          Certaines situations entraînent une majoration du salaire de l'apprenti par rapport à la grille standard (
          <DsfrLink
            href="https://travail-emploi.gouv.fr/questions-reponses-la-formation-en-alternance"
            aria-label="Consulter le site travail-emploi.gouv.fr – Questions-réponses sur la rémunération des apprentis"
          >
            travail-emploi.gouv.fr – Questions-réponses sur la rémunération des apprentis
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Durée du contrat inférieure à la durée totale du cycle de formation
        </Paragraph>
        <Paragraph>
          Lorsque la durée du contrat d'apprentissage est réduite (par exemple pour un apprenti déjà titulaire d'un diplôme en rapport avec la formation), l'apprenti est considéré,
          en ce qui concerne sa rémunération minimale, comme ayant déjà accompli une durée d'apprentissage égale à la différence entre la durée initiale du cycle de formation et la
          durée réduite (
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041769591" aria-label="Consulter l'article D. 6222-28-1 du Code du travail – Légifrance">
            article D. 6222-28-1 du Code du travail – Légifrance
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph>
          Exemple : Si le jeune a réalisé une année master 1 en formation sous statut étudiant, et l’année de master 2 sous statut apprenti alors la rémunération en deuxième année
          de master est calculée sur la base d’une 2ème année d’un contrat d’apprentissage.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Succession de contrats d'apprentissage
        </Paragraph>
        <Paragraph>
          Un apprenti qui signe un nouveau contrat d'apprentissage après un premier contrat ayant conduit à l'obtention du diplôme bénéficie d'une rémunération au moins égale à
          celle qu'il percevait lors de sa dernière année d'exécution du contrat précédent, sauf si l'application du barème standard en fonction de son âge lui est plus favorable (
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038033223" aria-label="Consulter l'article D. 6222-29 du Code du travail – Légifrance">
            article D. 6222-29 du Code du travail – Légifrance
          </DsfrLink>
          ;{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/formation-en-alternance/apprentissage-et-formation-en-alternance"
            aria-label="Consulter le site travail-emploi.gouv.fr – Le contrat d'apprentissage"
          >
            travail-emploi.gouv.fr – Le contrat d'apprentissage
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Avantages en nature
        </Paragraph>
        <Paragraph>
          L’employeur peut déduire du salaire de l'apprenti des avantages en nature (nourriture, logement) dans la limite de 75 % de la déduction autorisée pour les autres salariés
          (
          <DsfrLink href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018524085" aria-label="Consulter l'article D. 6222-35 du Code du travail – Légifrance">
            article D. 6222-35 du Code du travail – Légifrance
          </DsfrLink>
          ). Ces déductions ne peuvent pas amener la rémunération en dessous du minimum légal.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Un minimum réglementaire
        </Paragraph>
        <Paragraph>
          La réglementation fixe des minimums de salaires pour les apprentis. Les conventions collectives des entreprises peuvent définir un seuil supérieur à appliquer. Chaque
          employeur est libre de définir une rémunération supérieure à ces minimums.
        </Paragraph>
      </Section>
      <Section title="Salaire en contrat de professionnalisation en 2026">
        <Paragraph>
          Le contrat de professionnalisation offre une rémunération différente, basée sur l'âge du bénéficiaire et son niveau de formation initial au début du contrat. La
          rémunération minimale s'élève à 55 % du SMIC pour les moins de 21 ans sans qualification. La rémunération ne peut pas être inférieure au SMIC (1 823,03 € brut en janvier
          2026) ni à 85 % du salaire minimum conventionnel de branche.
        </Paragraph>
        <TableArticle
          headers={["Âge", "Diplôme actuel inférieur au Bac", "Diplôme actuel égal ou supérieur au Bac"]}
          data={[
            ["Moins de 21 ans", "55 %", "65 %"],
            ["21 à 25 ans", "70 %", "80 %"],
            ["26 ans et plus", "100 % SMIC ou 85 % SMC*", "100 % SMIC ou 85 % SMC*"],
          ]}
        />
        <Paragraph>*La rémunération ne peut pas être inférieure au SMIC (1 823,03 €) ni à 85 % du salaire minimum conventionnel de branche (SMC)</Paragraph>
      </Section>
      <Section title="Salaire brut et salaire net en alternance">
        <Paragraph>Le salaire net perçu par l'alternant varie selon le type de contrat en raison d'exonérations spécifiques.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Charges sociales en contrat d'apprentissage
        </Paragraph>
        <Paragraph>
          Pour les contrats conclus avant le 1er mars 2025 : les apprentis bénéficient d'exonérations de cotisations salariales sur la part de leur rémunération inférieure ou égale
          à 79 % du SMIC.
        </Paragraph>
        <Paragraph>
          Pour les contrats conclus à partir du 1er mars 2025 : le seuil d'exonération est abaissé à 50 % du SMIC (environ 911,52 € brut). Au-delà de ce seuil, les cotisations
          sociales s'appliquent.
        </Paragraph>
        <Paragraph>Concrètement :</Paragraph>
        <ParagraphList
          listItems={[
            "Rémunération ≤ 50 % du SMIC (contrats 2025) : le salaire net est quasiment égal au salaire brut",
            "Rémunération > 50 % du SMIC (contrats 2025) : les cotisations salariales classiques s'appliquent sur la part dépassant ce seuil",
          ]}
        />
        <Paragraph>
          Pour les contrats conclus avec un organisme public (mairie,…) les cotisations sociales sont à la charge de l’employeur. Le salaire net égale le salaire brut.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Charges sociales en contrat de professionnalisation
        </Paragraph>
        <Paragraph>
          Le contrat de professionnalisation ne bénéficie pas d'exonérations spécifiques de cotisations salariales. Les cotisations salariales classiques s'appliquent, ce qui
          représente environ 22 % du salaire brut. Le salaire net représente donc environ 78 % du salaire brut.
        </Paragraph>
        <Paragraph>Exemple comparatif pour un salaire brut de 1 200 € :</Paragraph>
        <ParagraphList
          listItems={[
            "En apprentissage (contrat avant mars 2025) : environ 1 150 € net",
            "En apprentissage (contrat depuis mars 2025) : environ 1 080 € net",
            "En professionnalisation : environ 935 € net",
          ]}
        />
      </Section>
      <Section title="Simuler sa rémunération en alternance">
        <Paragraph>
          Pour obtenir une estimation précise de votre rémunération en alternance, vous pouvez utiliser notre simulateur. Cet outil permet de calculer le salaire brut et net de
          l'alternant.
        </Paragraph>
        <Paragraph>
          👉{" "}
          <DsfrLink href={PAGES.static.salaireAlternant.getPath()} aria-label="Accéder au simulateur de rémunération alternant">
            Accéder au simulateur de rémunération
          </DsfrLink>
        </Paragraph>
      </Section>
      <Section title="Exonération fiscale du salaire des apprentis">
        <Paragraph>
          En application de l'article 81 bis du Code général des impôts (Légifrance), les salaires versés aux apprentis sont exonérés d'impôt sur le revenu dans une limite égale au
          montant annuel du SMIC (
          <DsfrLink
            href="https://travail-emploi.gouv.fr/formation-en-alternance/apprentissage-et-formation-en-alternance"
            aria-label="Consulter le site travail-emploi.gouv.fr – Le contrat d'apprentissage"
          >
            travail-emploi.gouv.fr – Le contrat d'apprentissage
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph>
          Les salariés en contrat de professionnalisation sont imposés selon le régime classique de droit commun (
          <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" aria-label="Consulter le site service-public.fr – Contrat de professionnalisation">
            service-public.fr – Contrat de professionnalisation
          </DsfrLink>
          ).
        </Paragraph>
      </Section>
      <Section title="FAQ : Vos questions sur le salaire en alternance">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          L'alternant est-il payé pendant ses périodes de formation ?
        </Paragraph>
        <Paragraph>
          Oui, l'alternant perçoit son salaire à la fois pendant les périodes en entreprise et pendant les périodes de formation en CFA ou organisme de formation. C'est l'employeur
          qui verse l'intégralité du salaire (
          <DsfrLink href={"https://travail-emploi.gouv.fr/lapprentissage-au-quotidien"} aria-label="Consulter le site travail-emploi.gouv.fr – L'apprentissage au quotidien">
            travail-emploi.gouv.fr – L'apprentissage au quotidien
          </DsfrLink>
          ).
        </Paragraph>{" "}
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Le salaire est-il versé pendant les congés payés ?
        </Paragraph>
        <Paragraph>
          Oui, comme tout salarié, l'alternant bénéficie de congés payés rémunérés : 5 semaines par an minimum (
          <DsfrLink href={"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033020517"} aria-label={"Consulter l'article L. 3141-3 du Code du travail – Légifrance"}>
            article L. 3141-3 du Code du travail – Légifrance
          </DsfrLink>
          ). Le salaire est maintenu pendant les congés (
          <DsfrLink href={"https://travail-emploi.gouv.fr/lapprentissage-au-quotidien"} aria-label="Consulter le site travail-emploi.gouv.fr – L'apprentissage au quotidien">
            travail-emploi.gouv.fr – L'apprentissage au quotidien
          </DsfrLink>
          ).
        </Paragraph>
        <Paragraph>
          Pour en savoir plus, rendez-vous sur le site du Ministère du Travail (
          <DsfrLink href={"https://travail-emploi.gouv.fr"} aria-label="Consulter le site travail-emploi.gouv.fr – Ministère du Travail">
            travail-emploi.gouv.fr
          </DsfrLink>
          ) :
        </Paragraph>
        <ParagraphList
          listItems={[
            <DsfrLink
              href={"https://travail-emploi.gouv.fr/formation-en-alternance/apprentissage-et-formation-en-alternance"}
              aria-label="Consulter le site travail-emploi.gouv.fr – Le contrat d'apprentissage"
            >
              Le contrat d'apprentissage
            </DsfrLink>,
            <DsfrLink href={"https://travail-emploi.gouv.fr/lapprentissage-au-quotidien"} aria-label="Consulter le site travail-emploi.gouv.fr – L'apprentissage au quotidien">
              L'apprentissage au quotidien
            </DsfrLink>,
            <DsfrLink
              href={"https://travail-emploi.gouv.fr/questions-reponses-la-formation-en-alternance"}
              aria-label="Consulter le site travail-emploi.gouv.fr – Questions-réponses sur la rémunération des apprentis (PDF)"
            >
              Questions-réponses sur la rémunération des apprentis (PDF)
            </DsfrLink>,
          ]}
        />
      </Section>
    </LayoutArticle>
  )
}

export default ComprendreLaRemunerationPage
