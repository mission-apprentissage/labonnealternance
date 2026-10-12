import type { FormikProps } from "formik"
import { type RefObject, useCallback, useRef } from "react"
import { flushSync } from "react-dom"

/**
 * Fabrique un handler onSubmit pour un formulaire Formik dont le bouton n'est pas désactivé par
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

// Certains champs (ex: job_type, un groupe de checkboxes) n'ont pas d'élément DOM avec
// name="<clé Formik>" : chaque checkbox a son propre name. On les repère via un conteneur
// marqué data-field-name="<clé>" et on cible son premier élément focusable.
const findFieldElement = (name: string): HTMLElement | null => {
  const escapedName = CSS.escape(name)
  const container = document.querySelector<HTMLElement>(`[data-field-name="${escapedName}"]`)
  if (container) {
    return container.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]") ?? container
  }
  return document.querySelector<HTMLElement>(`[name="${escapedName}"]`)
}

// Focus le premier champ en erreur dans l'ordre visuel (DOM), pas dans l'ordre des clés de errors
// (non garanti). Fonctionne aussi sur mobile : scrollIntoView + focus sont supportés nativement.
const focusFirstInvalidField = (errorFieldNames: string[]) => {
  const candidates = errorFieldNames
    .map((name) => findFieldElement(name))
    .filter((el): el is HTMLElement => Boolean(el))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))

  const target = candidates[0]
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" })
    target.focus({ preventScroll: true })
  }
}

/**
 * Équivalent de createSubmitWithFocusOnError pour les formulaires sans balise <form> (dépôt d'offre, prolongation) : le bouton ne dépend
 * pas de isValid ; au clic, l'erreur est affichée sur tous les champs invalides et le focus est déplacé sur
 * le premier d'entre eux dans l'ordre du DOM (RGAA 11.10, 12.8).
 */
export const submitOrFocusFirstInvalidField = async ({ validateForm, setTouched, submitForm }: Pick<FormikProps<any>, "validateForm" | "setTouched" | "submitForm">) => {
  const validationErrors = await validateForm()
  const errorFieldNames = Object.keys(validationErrors)

  if (errorFieldNames.length > 0) {
    // state="error" des composants DSFR est conditionné par touched pour la plupart des champs
    await setTouched(Object.fromEntries(errorFieldNames.map((name) => [name, true])), false)
    focusFirstInvalidField(errorFieldNames)
    return
  }

  await submitForm()
}

/**
 * Erreur renvoyée par l'API sur un champ (ex. e-mail déjà utilisé) : la soumission a déjà eu lieu, le focus
 * n'est donc pas pris en charge par les helpers ci-dessus. flushSync rend le message et son lien
 * aria-describedby avant le focus, pour qu'il soit annoncé avec le champ (RGAA 11.10).
 */
export const setFieldErrorAndFocus = (setFieldError: (field: string, message: string) => void, name: string, message: string) => {
  flushSync(() => setFieldError(name, message))
  focusFirstInvalidField([name])
}

/**
 * Erreur API rattachée à un champ et maintenue tant que la valeur rejetée n'a pas changé : un setFieldError seul
 * est écrasé à la validation suivante (dès la sortie du champ), ce qui rend le lien du message (« Connexion »)
 * inatteignable au clavier. `validate` se passe à <Formik> en plus de validationSchema : Formik fusionne les deux,
 * et la même valeur ne peut pas être soumise à nouveau.
 */
export const useServerFieldErrors = () => {
  const rejected = useRef(new Map<string, { value: unknown; message: string }>())

  const validate = useCallback(
    (values: Record<string, unknown>) =>
      Object.fromEntries([...rejected.current].filter(([name, { value }]) => values[name] === value).map(([name, { message }]) => [name, message])),
    []
  )

  const setServerFieldError = useCallback((setFieldError: (field: string, message: string) => void, name: string, value: unknown, message: string) => {
    rejected.current.set(name, { value, message })
    setFieldErrorAndFocus(setFieldError, name, message)
  }, [])

  return { validate, setServerFieldError }
}
