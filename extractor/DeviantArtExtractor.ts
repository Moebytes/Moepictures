import DeviantArt from "deviantart.ts"
import {SourceExtractor} from "./SourceExtractor"

let deviantart: DeviantArt

export class DeviantArtExtractor extends SourceExtractor {
    public matches = (url: string) => {
        return /deviantart\.com/.test(url)
    }

    public init = async () => {
        try {
            deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
        } catch (e) {
            console.log(e)
        }
    }

    public extractImages = async (url: string) => {
        if (!deviantart) await this.init()
        const deviationRSS = await deviantart.rss.get(url)
        if (!deviationRSS) throw new Error("bad deviation")
        let images = [] as Buffer[]
        for (const image of deviationRSS.content) {
            let buffer = await this.fetchBuffer(image.url)
            images.push(buffer)
        }
        return images
    }
}