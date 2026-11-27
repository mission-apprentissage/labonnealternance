import { fr } from "@codegouvfr/react-dsfr"
import type { IPage } from "@/utils/routes.utils"
import { PAGES } from "@/utils/routes.utils"
import { DsfrBreadcrumb } from "./DsfrBreadcrumb"
import DefaultContainer from "./Layout/DefaultContainer"

export function Breadcrumb({ pages }: { pages: IPage[] }) {
  const rest = [...pages]
  const currentPage = rest.pop()

  return (
    <DefaultContainer>
      <DsfrBreadcrumb
        style={{ marginBottom: fr.spacing("4v"), marginTop: fr.spacing("4v") }}
        currentPageLabel={currentPage?.title}
        homeLinkProps={{
          href: PAGES.static.home.getPath(),
        }}
        segments={rest.map((page) => ({
          label: page.title,
          linkProps: {
            href: page.getPath(),
          },
        }))}
      />
    </DefaultContainer>
  )
}
