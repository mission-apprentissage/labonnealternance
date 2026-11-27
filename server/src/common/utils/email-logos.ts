import config from "@/config"

/**
 * Logos des partials `header` et `footer` des templates d'e-mails. PNG en 2x affichés à la moitié de leur taille
 * (cf. partials), noms distincts des anciens logos pour ne pas être servis depuis le cache des clients mail.
 */
export const getEmailLogos = () => {
  const imagePath = `${config.publicUrl}/images/emails/`
  return {
    logoRf: `${imagePath}logo_republique_francaise.png`,
    logoLba: `${imagePath}logo_la_bonne_alternance.png`,
    logoNumeriqueGouv: `${imagePath}logo_numerique_gouv.png`,
  }
}
