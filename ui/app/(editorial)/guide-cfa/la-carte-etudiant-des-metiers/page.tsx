import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideCFALaCarteEtudiantDesMetiers.getMetadata()

const LaCarteEtudiantDesMetiersPage = () => {
  const pages = [PAGES.static.guideCFA, PAGES.static.guideCFALaCarteEtudiantDesMetiers]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["la-carte-etudiant-des-metiers"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["la-carte-etudiant-des-metiers"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
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
          <DsfrLink href={PAGES.static.espaceProCreationCfa.getPath()} aria-label="Accédez à votre espace CFA connecté">
            accédez à votre espace connecté
          </DsfrLink>{" "}
          pour télécharger le modèle de la carte étudiant des métiers.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default LaCarteEtudiantDesMetiersPage
