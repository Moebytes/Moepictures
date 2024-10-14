import axios from "axios"
import crypto from "crypto"
import functions from "./Functions"

export default class Crypto {
    public static encrypt = (buffer: ArrayBuffer) => {
       return buffer
    }

    public static decrypt = (buffer: ArrayBuffer) => {
      return buffer
   }

   public static decryptedLink = async (link: string) => {
      if (link.includes("/unverified")) return link
      if (functions.isVideo(link) || functions.isGIF(link)) return link
      const buffer = await fetch(link, {credentials: "include", cache: "force-cache"}).then((r) => r.arrayBuffer())
      if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return link
      if (!functions.isEncrypted(buffer)) return link
      try {
          const decrypted = Crypto.decrypt(buffer)
          const blob = new Blob([new Uint8Array(decrypted)])
          return URL.createObjectURL(blob)
      } catch {
          return link
      }
   }

   public static decryptedBuffer = async (link: string) => {
      const buffer = await fetch(link, {credentials: "include", cache: "force-cache"}).then((r) => r.arrayBuffer())
      if (link.includes("/unverified")) return buffer
      if (functions.isVideo(link) || functions.isGIF(link)) buffer
      if (!functions.isEncrypted(buffer)) return buffer
      if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return buffer
      const decrypted = Crypto.decrypt(buffer)
      return decrypted
   }
}