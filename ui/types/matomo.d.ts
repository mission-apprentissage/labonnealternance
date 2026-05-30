declare global {
  interface MatomoEvent {
    event: string
    [key: string]: unknown
  }

  interface Window {
    _mtm?: MatomoEvent[]
  }
}

export {}
