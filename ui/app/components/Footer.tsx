import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer"

export function Footer() {
  return (
    <DsfrFooter
      accessibility="fully compliant"
      contentDescription="La bonne alternance. Trouvez votre alternance."
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
      linkList={[
        {
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
              text: "Conditions générales d'utilisation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Politique de confidentialité",
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
              text: "FAQ",
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
          links: [
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
              text: "Contact",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Métiers",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "A propos",
            },
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
          ],
        },
      ]}
      bottomItems={[
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
          text: "Contact",
        },
        {
          linkProps: {
            href: "#",
          },
          text: "Métiers",
        },
        {
          linkProps: {
            href: "#",
          },
          text: "A propos",
        },
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
          text: "Mentions légales",
        },
        {
          linkProps: {
            href: "#",
          },
          text: "Conditions générales d'utilisation",
        },
        {
          linkProps: {
            href: "#",
          },
          text: "Politique de confidentialité",
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
          text: "FAQ",
        },
        {
          linkProps: {
            href: "#",
          },
          text: "Ressources",
        },
      ]}
    />
  )
}
