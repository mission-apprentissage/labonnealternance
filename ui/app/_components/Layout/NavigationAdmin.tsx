"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"

import { PAGES } from "@/utils/routes.utils"

type AdminNavItem = {
  text: string
  href: string
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { text: "Recruteurs à traiter", href: PAGES.static.backAdminHome.getPath() },
  { text: "Gestion des recruteurs", href: PAGES.static.backAdminGestionDesRecruteurs.getPath() },
  { text: "Entreprises de l'algorithme", href: PAGES.static.backAdminGestionDesEntreprises.getPath() },
  { text: "Rendez-vous apprentissage", href: PAGES.static.rendezVousApprentissageRecherche.getPath() },
  { text: "Gestion des administrateurs", href: PAGES.static.backAdminGestionDesAdministrateurs.getPath() },
  { text: "Gestion des jobs", href: PAGES.static.adminProcessor.getPath() },
]

function isLinkActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href)
}

const NavigationAdmin = () => {
  const pathname = usePathname()

  const items = ADMIN_NAV_ITEMS.map((item) => ({
    text: item.text,
    isActive: isLinkActive(pathname, item.href),
    linkProps: {
      href: item.href,
    },
  }))

  return <MainNavigation items={items} />
}

export default NavigationAdmin
