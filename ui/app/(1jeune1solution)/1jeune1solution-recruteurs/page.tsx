import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import Social from "@/app/(1jeune1solution)/components/Social"

export default async function unJeune1Solution({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
    >
      <Social />
    </Container>
  )
}
