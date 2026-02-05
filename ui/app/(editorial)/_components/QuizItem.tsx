import Card from "@codegouvfr/react-dsfr/Card"
import Badge from "@codegouvfr/react-dsfr/Badge"
import { Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"

export const QuizItem = ({ title, desc, href }: { title: string; desc: string; href: string }) => (
  <Card
    start={
      <Badge
        style={{
          // padding: fr.spacing("1v"),
          paddingLeft: fr.spacing("1w"),
          paddingRight: fr.spacing("1w"),
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
      <Typography component={"h3"} variant="h6" gutterBottom>
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
  />
)
