"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"

import { PAGES } from "@/utils/routes.utils"

type AdminNavLink = {
  text: string
  href: string
}

type AdminNavEntry = AdminNavLink | { text: string; children: AdminNavLink[] }

const ADMIN_NAV_ITEMS: AdminNavEntry[] = [
  {
    text: "Recruteurs",
    children: [
      { text: "Recruteurs en attente de validation", href: PAGES.static.backAdminHome.getPath() },
      { text: "Gestion des recruteurs", href: PAGES.static.backAdminGestionDesRecruteurs.getPath() },
      { text: "Entreprises de l'algorithme", href: PAGES.static.backAdminGestionDesEntreprises.getPath() },
      { text: "Offres partenaires", href: PAGES.static.backAdminGestionDesOffresPartenaires.getPath() },
    ],
  },
  { text: "Rendez-vous apprentissage", href: PAGES.static.rendezVousApprentissageRecherche.getPath() },
  { text: "Gestion des administrateurs", href: PAGES.static.backAdminGestionDesAdministrateurs.getPath() },
  { text: "Gestion des jobs", href: PAGES.static.adminProcessor.getPath() },
]

function isLinkActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href)
}

const NavigationAdmin = () => {
  const pathname = usePathname()

  type NavItem = ComponentProps<typeof MainNavigation>["items"][number]

  const items: NavItem[] = ADMIN_NAV_ITEMS.map((entry): NavItem => {
    if ("children" in entry) {
      return {
        text: entry.text,
        isActive: entry.children.some((child) => isLinkActive(pathname, child.href)),
        menuLinks: entry.children.map((child) => ({
          text: child.text,
          isActive: isLinkActive(pathname, child.href),
          linkProps: {
            href: child.href,
          },
        })),
      } as NavItem
    }

    return {
      text: entry.text,
      isActive: isLinkActive(pathname, entry.href),
      linkProps: {
        href: entry.href,
      },
    }
  })

  return <MainNavigation items={items} />
}

export default NavigationAdmin
