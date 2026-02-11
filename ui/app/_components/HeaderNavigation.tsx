"use client"

import { usePathname } from "next/navigation"
import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { PAGES } from "@/utils/routes.utils"
import { parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

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
        text: "Je m'informe sur l'alternance",
        href: PAGES.static.guideAlternant.getPath(),
      },
      {
        text: "Je recherche une alternance",
        href: PAGES.dynamic.recherche(parseRecherchePageParams(null, null)).getPath(),
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
        href: PAGES.static.guideCFA.getPath(),
      },
      {
        text: "Je télécharge la carte étudiant des métiers",
        href: PAGES.static.carteDEtudiantDesMetiers.getPath(),
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

export function HeaderNavigation() {
  const pathname = usePathname()

  const items = NAV_ITEMS.map((item) => ({
    text: item.text,
    isActive: isMenuActive(pathname, item.menuLinks),
    menuLinks: item.menuLinks.map((link) => ({
      text: link.text,
      isActive: isLinkActive(pathname, link.href),
      linkProps: {
        href: link.href,
      },
    })),
  }))

  return <MainNavigation items={items} />
}
