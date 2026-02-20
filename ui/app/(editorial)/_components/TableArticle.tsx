import Table from "@codegouvfr/react-dsfr/Table"
import type { ReactNode } from "react"

export const TableArticle = ({ caption, headers, data }: { caption?: ReactNode; headers: string[]; data: string[][] }) => {
  return <Table caption={caption} data={data} headers={headers} style={{ margin: 0 }} />
}
