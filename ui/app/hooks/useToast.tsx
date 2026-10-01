import type { SharedProps } from "notistack"
import { enqueueSnackbar } from "notistack"
import { useCallback } from "react"

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

    enqueueSnackbar(message, {
      variant: opts.variant ?? "success",
      autoHideDuration: opts.autoHideDuration ?? 3000,
      anchorOrigin: { horizontal: "right", vertical: "top" },
    })
  }, [])
}
