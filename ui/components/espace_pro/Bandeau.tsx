import { Alert } from "@codegouvfr/react-dsfr/Alert"
import { Link } from "@mui/material"

export type BandeauProps = {
  header: React.ReactNode
  description: React.ReactNode
  lien?: string
  type: "success" | "error"
}

export const Bandeau = ({ header, description, lien = null, type }: BandeauProps) => {
  const descriptionContent = (
    <>
      {description}
      {lien && (
        <Link ml={1} underline="always" href={lien} color="inherit" target="_blank" rel="noopener noreferrer">
          {lien}
        </Link>
      )}
    </>
  )

  return <Alert severity={type === "success" ? "success" : "error"} sx={{ mb: 4 }} title={header} description={descriptionContent} />
}
