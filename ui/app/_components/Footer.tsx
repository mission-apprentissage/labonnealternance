import type { FooterProps } from "@codegouvfr/react-dsfr/Footer"
import { Typography } from "@mui/material"

import { DsfrHeaderProps } from "./Header"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { PAGES } from "@/utils/routes.utils"

import { publicConfig } from "@/config.public"

type LinkItem = {
  linkProps: {
    href: string
  }
  text: string
  isExternal?: boolean
}

type LinkCategory = {
  categoryName: string
  links: LinkItem[]
}

const linkListContent: LinkCategory[] = [
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
        isExternal: true,
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
        isExternal: true,
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
    <footer className="fr-footer" role="contentinfo" id="footer-links">
      {showLinkList && (
        <nav className="fr-footer__top" role="navigation" aria-label="Informations et liens du site">
          <h2 className="fr-sr-only">Informations et liens du site</h2>
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--gutters">
              {linkListContent.map((category, index) => (
                <div key={index} className="fr-col-12 fr-col-sm-3 fr-col-md-2">
                  <h3 className="fr-footer__top-cat">{category.categoryName}</h3>
                  <ul className="fr-footer__top-list">
                    {category.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        {link.isExternal ? (
                          <a className="fr-footer__top-link" href={link.linkProps.href as string} target="_blank" rel="noopener noreferrer">
                            {link.text}
                          </a>
                        ) : (
                          <a className="fr-footer__top-link" href={link.linkProps.href as string}>
                            {link.text}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>
      )}
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <p className="fr-logo">{DsfrHeaderProps.brandTop}</p>
            <a className="fr-footer__brand-link" href={DsfrHeaderProps.homeLinkProps.href as string} title={DsfrHeaderProps.homeLinkProps.title}>
              <img className="fr-footer__logo" src="/images/france_relance.svg" alt="France relance" style={{ width: "3.5rem", height: "auto" }} />
            </a>
          </div>
          <div className="fr-footer__content">
            <p className="fr-footer__content-desc">{isWidget ? widgetDescription : description}</p>
            <ul className="fr-footer__content-list">
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" href="https://info.gouv.fr/" target="_blank" rel="noopener noreferrer">
                  info.gouv.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" href="https://service-public.gouv.fr/" target="_blank" rel="noopener noreferrer">
                  service-public.gouv.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" href="https://legifrance.gouv.fr/" target="_blank" rel="noopener noreferrer">
                  legifrance.gouv.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" href="https://data.gouv.fr" target="_blank" rel="noopener noreferrer">
                  data.gouv.fr
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={PAGES.static.accessibilite.getPath()}>
                Accessibilité: partiellement conforme
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={PAGES.static.politiqueConfidentialite.getPath()}>
                Politique de confidentialité
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={PAGES.static.mentionsLegales.getPath()}>
                Mentions légales
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={PAGES.static.cgu.getPath()}>
                Conditions générales d'utilisation
              </a>
            </li>
          </ul>
          <div className="fr-footer__bottom-copy">
            <p>
              Sauf mention contraire, tous les contenus de ce site sont sous{" "}
              <a href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank" rel="noopener noreferrer">
                licence etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
