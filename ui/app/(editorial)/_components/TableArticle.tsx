import Table from "@codegouvfr/react-dsfr/Table"

export const TableArticle = ({ caption, headers, data }: { caption?: string; headers: string[]; data: string[][] }) => {
  return <Table caption={caption} data={data} headers={headers} />
}
