import type { Metadata } from "next"
import { AUTHTYPE } from "shared/constants/recruteur"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getMetadata()

const LaCarteEtudiantDesMetiersPage = async () => {
  const { user } = await getSession()
  const isCfaConnected = user && user.type === AUTHTYPE.CFA
  const linkCarteEtudiantDesMetiers = isCfaConnected ? PAGES.static.espaceProCfaCarteDEtudiantDesMetiers.getPath() : PAGES.static.authentification.getPath()
  const ariaLabelCarteEtudiantDesMetiers = isCfaConnected
    ? "Accédez à la page de téléchargement de la carte étudiant des métiers"
    : "Accédez à la page d'authentification pour accéder à votre espace CFA connecté"

  const pages = [PAGES.static.guideCfa, PAGES.static.guideCfaLaCarteEtudiantDesMetiers]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["la-carte-etudiant-des-metiers"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["la-carte-etudiant-des-metiers"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
      parentPage={PAGES.static.guideCfa}
      page={PAGES.static.guideCfaLaCarteEtudiantDesMetiers}
    >
      <Section>
        <Paragraph>
          La carte d’étudiant des métiers permet d’ouvrir droit à de nombreuses réductions (restaurant universitaire, cinéma, transports, musées, etc.) à l’instar des cartes
          d’étudiant de l’enseignement supérieur.
        </Paragraph>
        <Paragraph>
          Elle est valable sur l’ensemble du territoire national. L’établissement de formation doit délivrer la carte d’étudiant des métiers dans les 30 jours suivant votre
          inscription.
        </Paragraph>
        <Paragraph>En cas de rupture du contrat en alternance, elle doit être récupérée et détruite par l’établissement de formation qui l’a délivrée.</Paragraph>
        <Paragraph>Elle est systématiquement délivrée en contrat d’apprentissage. En contrat de professionnalisation, il faut en revanche remplir certaines conditions :</Paragraph>
        <ParagraphList
          listItems={[
            "être inscrit dans une qualification enregistrée au Répertoire national des certifications professionnelles (RNCP) ;",
            "être âgé de 16 à 25 ans ;",
            "la formation doit durer au minimum 12 mois.",
          ]}
        />
        <Paragraph>
          Si vous êtes un organisme de formation{" "}
          <DsfrLink href={linkCarteEtudiantDesMetiers} aria-label={ariaLabelCarteEtudiantDesMetiers}>
            accédez à votre espace connecté
          </DsfrLink>{" "}
          pour télécharger le modèle de la carte étudiant des métiers.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default LaCarteEtudiantDesMetiersPage
