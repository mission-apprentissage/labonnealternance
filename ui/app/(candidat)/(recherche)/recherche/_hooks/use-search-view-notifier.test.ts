import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createSearchViewNotifier } from "./use-search-view-notifier"

describe("createSearchViewNotifier", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = () => {
    const send = vi.fn()
    return { send, notifier: createSearchViewNotifier(send, 3_000) }
  }

  it("n'envoie pas une seconde fois un id déjà envoyé", () => {
    const { send, notifier } = setup()
    notifier.add(["a", "b"])
    vi.advanceTimersByTime(3_000)
    notifier.add(["a", "b"])
    vi.advanceTimersByTime(10_000)

    expect(send).toHaveBeenCalledTimes(1)
  })

  it("n'envoie qu'une fois un id ajouté plusieurs fois pendant la fenêtre", () => {
    const { send, notifier } = setup()
    notifier.add(["a"])
    notifier.add(["b", "b"])
    notifier.add(["b"])
    vi.advanceTimersByTime(3_000)

    expect(send.mock.calls).toEqual([[["a"]], [["b"]]])
  })

  it("n'envoie rien pour une liste vide", () => {
    const { send, notifier } = setup()
    notifier.add([])
    notifier.flush()
    vi.advanceTimersByTime(10_000)

    expect(send).not.toHaveBeenCalled()
  })

  it("envoie immédiatement le premier lot", () => {
    const { send, notifier } = setup()
    notifier.add(["a", "b"])

    expect(send).toHaveBeenCalledWith(["a", "b"])
  })

  it("regroupe les lots arrivés pendant la fenêtre en un seul appel, à son expiration", () => {
    const { send, notifier } = setup()
    notifier.add(["a"])
    vi.advanceTimersByTime(1_000)
    notifier.add(["b"])
    notifier.add(["c"])
    vi.advanceTimersByTime(1_999)

    expect(send).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)

    expect(send).toHaveBeenLastCalledWith(["b", "c"])
    expect(send).toHaveBeenCalledTimes(2)
  })

  it("envoie les derniers ids même si plus rien n'est affiché ensuite", () => {
    const { send, notifier } = setup()
    notifier.add(["a"])
    notifier.add(["dernier"])
    vi.advanceTimersByTime(3_000)

    expect(send).toHaveBeenLastCalledWith(["dernier"])
  })

  it("flush envoie sans attendre la fin de la fenêtre, et une seule fois", () => {
    const { send, notifier } = setup()
    notifier.add(["a"])
    notifier.add(["b"])
    notifier.flush()

    expect(send).toHaveBeenLastCalledWith(["b"])

    vi.advanceTimersByTime(10_000)

    expect(send).toHaveBeenCalledTimes(2)
  })
})
