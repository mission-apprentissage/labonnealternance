import { Netmask } from "netmask"

export const PRIVATE_NETWORKS = ["127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"].map((block) => new Netmask(block))

// Netmask ne gère que l'IPv4 et lève sur toute autre entrée (IPv6, octet > 255) : traitée comme publique.
export const isPrivateIp = (ip: string): boolean => {
  try {
    return PRIVATE_NETWORKS.some((block) => block.contains(ip))
  } catch {
    return false
  }
}
