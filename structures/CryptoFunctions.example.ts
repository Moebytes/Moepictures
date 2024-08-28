import axios from "axios"
import crypto from "crypto"
import functions from "./Functions"

export default class Crypto {
    public static encrypt = (buffer: Buffer) => {
       return buffer
    }

    public static decrypt = (buffer: Buffer) => {
      return buffer
   }

   public static decryptedLink = async (link: string) => {
      if (link.includes("/unverified")) return link 
      if (functions.isVideo(link) || functions.isGIF(link)) return link
      const buffer = await axios.get(link, {withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
      if (functions.isWebP(link)) if (await functions.isAnimatedWebp(buffer)) return link
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
      const buffer = await axios.get(link, {withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data) 
      if (link.includes("/unverified")) return buffer
      if (functions.isVideo(link) || functions.isGIF(link)) buffer
      if (!functions.isEncrypted(buffer)) return buffer
      if (functions.isWebP(link)) if (await functions.isAnimatedWebp(buffer)) return buffer
      const decrypted = Crypto.decrypt(buffer)
      return decrypted
   }
}