import type { FooterProps } from "@codegouvfr/react-dsfr/Footer"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrHeaderProps } from "./Header"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { PAGES } from "@/utils/routes.utils"

import { publicConfig } from "@/config.public"

const linkListContent: FooterProps["linkList"] = [
  {
    categoryName: "À propos",
    links: [
      {
        linkProps: {
          href: PAGES.static.aPropos.getPath(),
        },
        text: "A propos",
      },
      {
        linkProps: {
          href: PAGES.static.blog.getPath(),
        },
        text: "Blog",
      },
      {
        linkProps: {
          href: PAGES.static.metiers.getPath(),
        },
        text: "Métiers",
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
    categoryName: "Aide & Ressources",
    links: [
      {
        linkProps: {
          href: PAGES.static.faq.getPath(),
        },
        text: "FAQ",
      },
      {
        linkProps: {
          href: PAGES.static.ressources.getPath(),
        },
        text: "Ressources",
      },
      {
        linkProps: {
          href: PAGES.static.statistiques.getPath(),
        },
        text: "Statistiques",
      },
    ],
  },
  {
    categoryName: "Développeurs",
    links: [
      {
        linkProps: {
          href: PAGES.static.EspaceDeveloppeurs.getPath(),
        },
        text: "Espace développeurs",
      },
      {
        linkProps: {
          href: PAGES.static.codeSources.getPath(),
        },
        text: `Code source v${publicConfig.version}`,
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

  const showLinkList = !isWidget && !hideLinkList

  return (
    <Box component="footer" className={fr.cx("fr-footer")} role="contentinfo" id="footer-links">
      <Box className={fr.cx("fr-container")}>
        <Box className={fr.cx("fr-footer__body")}>
          <Box className={fr.cx("fr-footer__brand", "fr-enlarge-link")}>
            <Typography className={fr.cx("fr-logo")}>{DsfrHeaderProps.brandTop}</Typography>
            <Link className={fr.cx("fr-footer__brand-link")} href={DsfrHeaderProps.homeLinkProps.href} title={DsfrHeaderProps.homeLinkProps.title}>
              <Image className={fr.cx("fr-footer__logo")} src="/images/france_relance.svg" alt="France relance" width={56} height={56} style={{ width: "3.5rem", height: "auto" }} />
            </Link>
          </Box>
          <Box className={fr.cx("fr-footer__content")}>
            <Typography className={fr.cx("fr-footer__content-desc")}>{isWidget ? widgetDescription : description}</Typography>
            <Box component="ul" className={fr.cx("fr-footer__content-list")}>
              <Box component="li" className={fr.cx("fr-footer__content-item")}>
                <Link className={fr.cx("fr-footer__content-link")} href="https://legifrance.gouv.fr" target="_blank" rel="noopener noreferrer">
                  legifrance.gouv.fr
                </Link>
              </Box>
              <Box component="li" className={fr.cx("fr-footer__content-item")}>
                <Link className={fr.cx("fr-footer__content-link")} href="https://gouvernement.fr" target="_blank" rel="noopener noreferrer">
                  gouvernement.fr
                </Link>
              </Box>
              <Box component="li" className={fr.cx("fr-footer__content-item")}>
                <Link className={fr.cx("fr-footer__content-link")} href="https://service-public.fr" target="_blank" rel="noopener noreferrer">
                  service-public.fr
                </Link>
              </Box>
              <Box component="li" className={fr.cx("fr-footer__content-item")}>
                <Link className={fr.cx("fr-footer__content-link")} href="https://data.gouv.fr" target="_blank" rel="noopener noreferrer">
                  data.gouv.fr
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
        {showLinkList && (
          <Box className={fr.cx("fr-footer__body")}>
            <Box component="nav" className={fr.cx("fr-footer__body-nav")} role="navigation" aria-label="Informations et liens du site">
              <Typography component="h2" className={fr.cx("fr-sr-only")}>
                Informations et liens du site
              </Typography>
              <Box className={fr.cx("fr-footer__body-row")}>
                {linkListContent.map((category, index) => (
                  <Box key={index} className={fr.cx("fr-footer__body-col")}>
                    <Typography component="h3" className={fr.cx("fr-footer__top-cat")}>
                      {category.categoryName}
                    </Typography>
                    <Box component="ul" className={fr.cx("fr-footer__top-list")}>
                      {category.links.map((link, linkIndex) => (
                        <Box component="li" key={linkIndex}>
                          <Link className={fr.cx("fr-footer__top-link")} href={link.linkProps.href}>
                            {link.text}
                          </Link>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
        <Box className={fr.cx("fr-footer__bottom")}>
          <Box component="ul" className={fr.cx("fr-footer__bottom-list")}>
            <Box component="li" className={fr.cx("fr-footer__bottom-item")}>
              <Link className={fr.cx("fr-footer__bottom-link")} href={PAGES.static.accessibilite.getPath()}>
                Accessibilité: partiellement conforme
              </Link>
            </Box>
            <Box component="li" className={fr.cx("fr-footer__bottom-item")}>
              <Link className={fr.cx("fr-footer__bottom-link")} href={PAGES.static.politiqueConfidentialite.getPath()}>
                Politique de confidentialité
              </Link>
            </Box>
            <Box component="li" className={fr.cx("fr-footer__bottom-item")}>
              <Link className={fr.cx("fr-footer__bottom-link")} href={PAGES.static.mentionsLegales.getPath()}>
                Mentions légales
              </Link>
            </Box>
            <Box component="li" className={fr.cx("fr-footer__bottom-item")}>
              <Link className={fr.cx("fr-footer__bottom-link")} href={PAGES.static.cgu.getPath()}>
                Conditions générales d'utilisation
              </Link>
            </Box>
          </Box>
          <Box className={fr.cx("fr-footer__bottom-copy")}>
            <Typography>
              Sauf mention contraire, tous les contenus de ce site sont sous{" "}
              <Link href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank" rel="noopener noreferrer">
                licence etalab-2.0
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
