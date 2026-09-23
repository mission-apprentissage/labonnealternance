import type { FormikErrors, FormikProps, FormikTouched } from "formik"
import { setIn } from "formik"
import type { RefObject } from "react"

/**
 * Chemins des erreurs, à la notation des `name` Formik : `{ trigger: { scope: "…" } }` donne
 * `trigger.scope`, `{ questions: [, { label: "…" }] }` donne `questions.1.label`. Sur un formulaire
 * plat, ce sont simplement les clés de l'objet d'erreurs.
 */
const errorPaths = (errors: unknown, prefix = ""): string[] => {
  if (typeof errors === "string") return prefix ? [prefix] : []
  if (!errors || typeof errors !== "object") return []
  return Object.entries(errors).flatMap(([key, value]) => errorPaths(value, prefix ? `${prefix}.${key}` : key))
}

/** `questions.1.options.0.label` -> lui-même puis ses parents : l'erreur d'un élément de liste se rabat sur le champ de la liste. */
const withAncestors = (path: string) => path.split(".").map((_, index, parts) => parts.slice(0, parts.length - index).join("."))

/**
 * Fabrique un handler onSubmit pour un formulaire Formik dont le bouton n'est pas désactivé par
 * isValid : au submit, force l'affichage de l'erreur sur tous les champs invalides (setTouched) puis
 * scrolle/focus le premier champ en erreur dans l'ordre du DOM plutôt que de laisser le bouton inerte
 * sans indication visuelle. Repose sur l'attribut `name` de chaque champ (posé nativement par
 * CustomInput/OpcoSelect/HandiEngagementSelect) pour le retrouver via `formRef`.
 *
 * Les champs imbriqués (`trigger.scope`, `questions.0.label`) sont pris en charge : `touched` est
 * reconstruit à la même forme que les valeurs, et une erreur portée par un élément de liste que
 * rien ne nomme dans le DOM renvoie au champ qui porte le nom de la liste.
 *
 * Volontairement pas un hook (pas de `use` en préfixe) malgré la ressemblance : elle ne fait aucun appel
 * à React en interne, donc appelable depuis un render-prop Formik sans enfreindre les règles des hooks.
 *
 * Le <form> doit porter `noValidate` : sans ça, le navigateur peut intercepter la soumission avant que
 * ce handler ne s'exécute dès qu'un champ porte un attribut required natif (ex: le select OPCO).
 */
export const createSubmitWithFocusOnError = <Values>(
  formRef: RefObject<HTMLFormElement | null>,
  formik: Pick<FormikProps<Values>, "validateForm" | "setTouched" | "submitForm">
) => {
  return async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: FormikErrors<Values> = await formik.validateForm()
    const paths = errorPaths(errors)
    formik.setTouched(
      paths.reduce<FormikTouched<Values>>((touched, path) => setIn(touched, path, true), {}),
      false
    )
    if (paths.length > 0 && formRef.current) {
      const selector = [...new Set(paths.flatMap(withAncestors))].map((name) => `[name="${name}"]`).join(", ")
      const firstErrorEl = formRef.current.querySelector<HTMLElement>(selector)
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" })
        firstErrorEl.focus()
      }
      return
    }
    formik.submitForm()
  }
}
