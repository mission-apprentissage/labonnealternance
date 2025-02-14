import { Container } from "@chakra-ui/react"
import { Breadcrumb as DSFRBreadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb"

import type { IPage } from "@/utils/routes.utils"
import { PAGES } from "@/utils/routes.utils"

export default function Breadcrumb({ pages }: { pages: IPage[] }) {
  const rest = [...pages]
  const currentPage = rest.pop()

  return (
    <Container variant="responsiveContainer" display="flex">
      <DSFRBreadcrumb
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
    </Container>
  )
}
