import { Alert } from "@codegouvfr/react-dsfr/Alert"
import { Box, Link } from "@mui/material"

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

  return (
    <Box mb={1}>
      <Alert severity={type === "success" ? "success" : "error"} title={header} description={descriptionContent} />
    </Box>
  )
}
