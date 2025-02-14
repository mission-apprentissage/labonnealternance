import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer"

import { PAGES } from "../../utils/routes.utils"

import { DsfrHeaderProps } from "./Header"

export function Footer() {
  return (
    <DsfrFooter
      accessibility="fully compliant"
      contentDescription="La bonne alternance simplifie les mises en relation  entre les trois d’acteurs candidats, recruteurs et centres de formation, afin de faciliter les entrées en  alternance."
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
      brandTop={DsfrHeaderProps.brandTop}
      homeLinkProps={DsfrHeaderProps.homeLinkProps}
      linkList={[
        {
          categoryName: "Liens utiles",
          links: [
            {
              linkProps: {
                href: PAGES.static.faq.getPath(),
              },
              text: "FAQ",
            },
            {
              linkProps: {
                href: PAGES.static.blog.getPath(),
              },
              text: "Blog",
            },
            {
              linkProps: {
                href: PAGES.static.ressources.getPath(),
              },
              text: "Ressources",
            },
          ],
        },
        {
          categoryName: "Développement",
          links: [
            {
              linkProps: {
                href: PAGES.static.codeSources.getPath(),
              },
              text: "Code source",
            },
            {
              linkProps: {
                href: PAGES.static.EspaceDeveloppeurs.getPath(),
              },
              text: "Espace développeurs",
            },
            {
              linkProps: {
                href: PAGES.static.metiers.getPath(),
              },
              text: "Métiers",
            },
          ],
        },
        {
          categoryName: "L'organisation",
          links: [
            {
              linkProps: {
                href: PAGES.static.aPropos.getPath(),
              },
              text: "A propos",
            },
            {
              linkProps: {
                href: PAGES.static.statistiques.getPath(),
              },
              text: "Statistiques",
            },
            {
              linkProps: {
                href: PAGES.static.contact.getPath(),
              },
              text: "Contact",
            },
          ],
        },
        {
          categoryName: "Règlement générales des données",
          links: [
            {
              linkProps: {
                href: PAGES.static.mentionsLegales.getPath(),
              },
              text: "Mentions légales",
            },
            {
              linkProps: {
                href: PAGES.static.politiqueConfidentialite.getPath(),
              },
              text: "Politique de confidentialité",
            },
            {
              linkProps: {
                href: PAGES.static.cgu.getPath(),
              },
              text: "Conditions générales d'utilisation",
            },
          ],
        },
      ]}
    />
  )
}
