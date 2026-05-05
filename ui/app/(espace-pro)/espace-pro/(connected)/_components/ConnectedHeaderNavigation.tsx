"use client"

import MainNavigation from "@codegouvfr/react-dsfr/MainNavigation"
import { usePathname } from "next/navigation"
import { PAGES } from "@/utils/routes.utils"

type NavItem = {
  text: string
  linkProps: {
    href: string
  }
}

const CFA_NAV_ITEMS: NavItem[] = [
  {
    text: "Mes entreprises",
    linkProps: {
      href: PAGES.static.backCfaHome.getPath(),
    },
  },
  {
    text: "Carte d'étudiant des métiers",
    linkProps: {
      href: PAGES.static.espaceProCfaCarteDEtudiantDesMetiers.getPath(),
    },
  },
]

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname.endsWith(href)
}

export function ConnectedHeaderNavigation() {
  const pathname = usePathname()

  const items = CFA_NAV_ITEMS.map((item) => ({
    ...item,
    isActive: isLinkActive(pathname, item.linkProps.href),
  }))

  return <MainNavigation items={items} />
}
