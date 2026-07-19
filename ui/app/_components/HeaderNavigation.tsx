"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"
import { useNewSearchOptIn } from "@/app/search/_hooks/useNewSearchOptIn"
import { PAGES } from "@/utils/routes.utils"

type NavLink = {
  text: string
  href: string
}

type NavItem = {
  text: string
  menuLinks: NavLink[]
}

const NAV_ITEMS: NavItem[] = [
  {
    text: "Je suis alternant",
    menuLinks: [
      {
        text: "Je recherche une alternance",
        href: PAGES.dynamic.recherche({}).getPath(),
      },
      {
        text: "Je m'informe sur l'alternance",
        href: PAGES.static.guideAlternant.getPath(),
      },
      {
        text: "Je calcule ma rémunération",
        href: PAGES.static.salaireAlternant.getPath(),
      },
    ],
  },
  {
    text: "Je suis recruteur",
    menuLinks: [
      {
        text: "Je recrute un alternant",
        href: PAGES.static.jeSuisRecruteur.getPath(),
      },
      {
        text: "Je m'informe sur l'alternance",
        href: PAGES.static.guideRecruteur.getPath(),
      },
    ],
  },
  {
    text: "Je suis CFA",
    menuLinks: [
      {
        text: "Je recrute pour mes partenaires",
        href: PAGES.static.jeSuisCFA.getPath(),
      },
      {
        text: "Je m'informe sur l'alternance",
        href: PAGES.static.guideCfa.getPath(),
      },
      {
        text: "Je télécharge la carte étudiant des métiers",
        href: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getPath(),
      },
    ],
  },
]

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname.startsWith(href)
}

function isMenuActive(pathname: string, menuLinks: NavLink[]): boolean {
  return menuLinks.some((link) => isLinkActive(pathname, link.href))
}

const RECHERCHE_LEGACY_HREF = PAGES.dynamic.recherche({}).getPath()
const RECHERCHE_NEW_HREF = "/search/split"

export function HeaderNavigation() {
  const pathname = usePathname()

  // « Je recherche une alternance » suit l'opt-in au nouveau moteur (le SSR rend le href
  // legacy — snapshot serveur du hook — et la valeur client s'applique après l'hydratation).
  const { optedIn } = useNewSearchOptIn()
  const rechercheHref = optedIn ? RECHERCHE_NEW_HREF : RECHERCHE_LEGACY_HREF

  const items = NAV_ITEMS.map((item) => ({
    text: item.text,
    isActive: isMenuActive(pathname, item.menuLinks),
    menuLinks: item.menuLinks.map((link) => {
      const href = link.href === RECHERCHE_LEGACY_HREF ? rechercheHref : link.href
      return {
        text: link.text,
        isActive: isLinkActive(pathname, href),
        linkProps: { href },
      }
    }),
  }))

  return <MainNavigation items={items} />
}
