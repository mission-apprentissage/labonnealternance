import { describe, expect, it } from "vitest"

import { isPrivateIp } from "./private-network"

describe("isPrivateIp", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.0.1", "172.18.0.1", "172.31.255.255", "192.168.1.10"])("%s est privée", (ip) => {
    expect(isPrivateIp(ip)).toBe(true)
  })

  it.each(["203.0.113.10", "198.51.100.20", "172.15.255.255", "172.32.0.1", "192.169.0.1", "11.0.0.1"])("%s est publique", (ip) => {
    expect(isPrivateIp(ip)).toBe(false)
  })

  it.each(["::1", "::ffff:127.0.0.1", "", "pas-une-ip", "999.1.1.1", "10.0.0.300"])("%s n'est pas reconnue comme privée et ne lève pas", (ip) => {
    expect(isPrivateIp(ip)).toBe(false)
  })
})
