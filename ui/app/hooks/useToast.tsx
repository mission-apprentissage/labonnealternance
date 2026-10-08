import type { SharedProps } from "notistack"
import { enqueueSnackbar } from "notistack"
import { useCallback } from "react"
import { announceToast } from "@/app/_components/ToastAnnouncer"

interface ToastOptions extends Pick<SharedProps, "variant" | "autoHideDuration"> {
  title?: string
  description?: string
}

export function useToast() {
  return useCallback((opts: ToastOptions) => {
    // Contenu phrasé : il est rendu dans le <p> de description de l'Alert DSFR (cf. ToastContent).
    const message = (
      <>
        {opts.title && <strong>{opts.title}</strong>}
        {opts.title && opts.description && <br />}
        {opts.description}
      </>
    )

    const variant = opts.variant ?? "success"
    const autoHideDuration = opts.autoHideDuration ?? 3000
    enqueueSnackbar(message, { variant, autoHideDuration, anchorOrigin: { horizontal: "right", vertical: "top" } })
    announceToast([opts.title, opts.description].filter(Boolean).join(". "), variant === "error" || variant === "warning" ? "alert" : "status", autoHideDuration)
  }, [])
}
