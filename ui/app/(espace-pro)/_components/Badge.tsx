import { fr } from "@codegouvfr/react-dsfr"
import { Badge } from "@mui/material"

const variants = {
  inactive: {
    backgroundColor: "#FFE8E5",
    color: "#B34000",
  },
  active: {
    backgroundColor: "#B8FEC9",
    color: "#18753C",
  },
  awaiting: {
    backgroundColor: "#FEECC2",
    color: "#716043",
  },
  neutral: {
    backgroundColor: "#E8EDFF",
    color: "#0063CB",
  },
}

export default function LbaBadge({ variant = "neutral", children, ...props }) {
  return <Badge sx={{ ...props, ...variants[variant], px: fr.spacing("1v") }}>{children}</Badge>
}
