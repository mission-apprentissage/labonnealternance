import { fr } from "@codegouvfr/react-dsfr"
import Image from "next/image"

import visuelEdition from "@/public/images/la-lettre-de-l-alternance/visuel-edition.jpg"

/**
 * Carte d'une édition, qui mène à sa lecture sur LinkedIn. Le visuel, commun à toutes les éditions,
 * est décoratif (alt vide) : le titre et la date sont en texte dans la carte (RGAA 1.2).
 */
export function NewsletterCard({ title, date, href }: { title: string; date: string; href: string }) {
  return (
    <div className={fr.cx("fr-card", "fr-enlarge-link")} style={{ width: "100%" }}>
      <div className={fr.cx("fr-card__body")}>
        <div className={fr.cx("fr-card__content")}>
          <h3 className={fr.cx("fr-card__title")}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {title}
              <span className="fr-sr-only"> - nouvelle fenêtre</span>
            </a>
          </h3>
          <p className={fr.cx("fr-card__desc")}>Lire sur LinkedIn</p>
          <div className={fr.cx("fr-card__start")}>
            <p className={fr.cx("fr-card__detail")}>Édition du {date}</p>
          </div>
        </div>
      </div>
      <div className={fr.cx("fr-card__header")}>
        <div className={fr.cx("fr-card__img")}>
          <Image src={visuelEdition} alt="" sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw" className={fr.cx("fr-responsive-img")} />
        </div>
      </div>
    </div>
  )
}
