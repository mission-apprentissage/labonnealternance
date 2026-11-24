import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import Card from "@codegouvfr/react-dsfr/Card"
import { Typography } from "@mui/material"

export const QuizItem = ({ title, desc, href }: { title: string; desc: string; href: string }) => (
  <Card
    start={
      <Badge
        style={{
          paddingLeft: fr.spacing("2v"),
          paddingRight: fr.spacing("2v"),
          borderRadius: fr.spacing("3v"),
          marginBottom: fr.spacing("2v"),
          textTransform: "none",
          fontWeight: "normal",
        }}
      >
        <Typography component={"span"} variant="caption">
          Quiz
        </Typography>
      </Badge>
    }
    title={
      <Typography component="span" variant="h6" display="block" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        {title}
      </Typography>
    }
    desc={desc}
    linkProps={{
      href: href,
    }}
    style={{
      height: "100%",
    }}
    border
    shadow
    enlargeLink
  />
)
