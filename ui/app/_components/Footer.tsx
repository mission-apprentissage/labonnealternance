import type { FooterProps } from "@codegouvfr/react-dsfr/Footer"
import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer"
import { Typography } from "@mui/material"

import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { DsfrHeaderProps } from "./Header"
import { PAGES } from "@/utils/routes.utils"

import { publicConfig } from "@/config.public"

const linkListContent: FooterProps["linkList"] = [
  {
    categoryName: "Liens utiles",
    // @ts-ignore advised limit of links is 8
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
      {
        linkProps: {
          href: PAGES.static.codeSources.getPath(),
        },
        text: `Code source v${publicConfig.version}`,
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
    categoryName: "Alternance par ville",
    // @ts-ignore min 1 link but here we have 10
    links: villeData.map((ville) => ({
      linkProps: {
        href: PAGES.dynamic.seoVille(ville.slug).getPath(),
      },
      text: `Alternance à ${ville.ville}`,
    })),
  },
]

export function Footer({ isWidget = false, hideLinkList = false }: { isWidget?: boolean; hideLinkList?: boolean }) {
  const description =
    "La bonne alternance simplifie les mises en relation entre les trois types d’acteurs candidats, recruteurs et centres de formation, afin de faciliter les entrées en alternance."
  const widgetDescription = (
    <Typography>
      <Typography variant="h6">Le dépôt simplifié d'offre en alternance</Typography>
      La bonne alternance est un service public numérique qui simplifie les mises en relation entre les trois types d’acteurs candidats, recruteurs et centres de formation, afin de
      faciliter les entrées en alternance
    </Typography>
  )

  return (
    <DsfrFooter
      id="footer-links"
      accessibility="partially compliant"
      accessibilityLinkProps={{
        href: PAGES.static.accessibilite.getPath(),
      }}
      contentDescription={isWidget ? widgetDescription : description}
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
      brandTop={DsfrHeaderProps.brandTop}
      homeLinkProps={DsfrHeaderProps.homeLinkProps}
      linkList={isWidget ? undefined : hideLinkList ? undefined : linkListContent}
      bottomItems={[
        {
          linkProps: {
            href: PAGES.static.politiqueConfidentialite.getPath(),
          },
          text: "Politique de confidentialité",
        },
        {
          linkProps: {
            href: PAGES.static.mentionsLegales.getPath(),
          },
          text: "Mentions légales",
        },
        {
          linkProps: {
            href: PAGES.static.cgu.getPath(),
          },
          text: "Conditions générales d'utilisation",
        },
      ]}
    />
  )
}
