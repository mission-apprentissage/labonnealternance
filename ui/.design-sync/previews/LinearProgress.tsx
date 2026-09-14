import { LinearProgress, Stack, Typography } from "lba-ds"

export const Avancement = () => (
  <Stack direction="column" spacing={3} component="div" style={{ maxWidth: 420 }}>
    <div>
      <Typography variant="body2" component="p">
        Candidature — étape 2 sur 4
      </Typography>
      <LinearProgress variant="determinate" value={50} />
    </div>
    <div>
      <Typography variant="body2" component="p">
        Dossier complété à 80 %
      </Typography>
      <LinearProgress variant="determinate" value={80} color="success" />
    </div>
    <div>
      <Typography variant="body2" component="p">
        Envoi en cours…
      </Typography>
      <LinearProgress variant="indeterminate" />
    </div>
  </Stack>
)
