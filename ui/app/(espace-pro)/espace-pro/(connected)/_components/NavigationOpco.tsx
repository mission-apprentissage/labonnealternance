"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"

// La maquette (#6006) aligne le guide à droite : MainNavigation ne le permet pas, il suit les autres entrées.
const OPCO_NAV_ITEMS = [
  { text: "Entreprises", href: PAGES.static.backOpcoHome.getPath() },
  { text: MODERATION_PAGES.opcoQueue.title, href: MODERATION_PAGES.opcoQueue.getPath() },
  { text: MODERATION_PAGES.opcoGuide.title, href: MODERATION_PAGES.opcoGuide.getPath() },
]

// « Entreprises » couvre l'accueil OPCO et les fiches entreprise (/espace-pro/opco/users/…).
export const isOpcoNavItemActive = (pathname: string, href: string) =>
  href === PAGES.static.backOpcoHome.getPath() ? pathname === href || pathname.startsWith(`${href}/users`) : pathname.startsWith(href)

export function NavigationOpco() {
  const pathname = usePathname()
  return <MainNavigation items={OPCO_NAV_ITEMS.map(({ text, href }) => ({ text, isActive: isOpcoNavItemActive(pathname, href), linkProps: { href } }))} />
}
