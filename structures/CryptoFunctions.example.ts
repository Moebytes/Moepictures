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
      const encrypted = await axios.get(link, {withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
      if (functions.isWebP(link)) if (await functions.isAnimatedWebp(encrypted)) return link
      const decrypted = Crypto.decrypt(encrypted)
      const blob = new Blob([new Uint8Array(decrypted)])
      return URL.createObjectURL(blob)
   }
}