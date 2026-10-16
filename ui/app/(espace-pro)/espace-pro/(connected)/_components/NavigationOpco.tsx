"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"

const OPCO_NAV_ITEMS = [
  { text: "Entreprises", href: PAGES.static.backOpcoHome.getPath() },
  { text: "Offres à modérer", href: MODERATION_PAGES.opcoQueue.getPath() },
]

// « Entreprises » couvre l'accueil OPCO et les fiches entreprise (/espace-pro/opco/users/…).
const isActive = (pathname: string, href: string) =>
  href === PAGES.static.backOpcoHome.getPath() ? pathname === href || pathname.startsWith(`${href}/users`) : pathname.startsWith(href)

export function NavigationOpco() {
  const pathname = usePathname()
  return <MainNavigation items={OPCO_NAV_ITEMS.map(({ text, href }) => ({ text, isActive: isActive(pathname, href), linkProps: { href } }))} />
}
