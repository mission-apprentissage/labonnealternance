import type { FormikProps } from "formik"
import type { RefObject } from "react"

/**
 * Fabrique un handler onSubmit pour un formulaire Formik dont le bouton n'est plus désactivé par
 * isValid : au submit, force l'affichage de l'erreur sur tous les champs invalides (setTouched) puis
 * scrolle/focus le premier champ en erreur dans l'ordre du DOM plutôt que de laisser le bouton inerte
 * sans indication visuelle. Repose sur l'attribut `name` de chaque champ (posé nativement par
 * CustomInput/OpcoSelect/HandiEngagementSelect) pour le retrouver via `formRef`.
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
    const errors = await formik.validateForm()
    const errorNames = Object.keys(errors)
    formik.setTouched(Object.fromEntries(errorNames.map((name) => [name, true])) as any, false)
    if (errorNames.length > 0 && formRef.current) {
      const selector = errorNames.map((name) => `[name="${name}"]`).join(", ")
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
