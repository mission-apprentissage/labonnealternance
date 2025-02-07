import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer"

import { PAGES } from "../../utils/routes.utils"

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
      linkList={[
        {
          categoryName: "Liens utiles",
          links: [
            {
              linkProps: {
                href: "#",
              },
              text: "FAQ",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Blog",
            },
            {
              linkProps: {
                href: "#",
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
                href: "#",
              },
              text: "Code source",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Nos données",
            },
            {
              linkProps: {
                href: "#",
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
                href: "#",
              },
              text: "Statistiques",
            },
            {
              linkProps: {
                href: "#",
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
                href: "#",
              },
              text: "Mentions légales",
            },
            {
              linkProps: {
                href: "#",
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
