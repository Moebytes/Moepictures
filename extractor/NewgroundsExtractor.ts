import {SourceExtractor} from "./SourceExtractor"

export class NewgroundsExtractor extends SourceExtractor {
    public matches = (url: string) => {
        return /newgrounds\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const image = html.match(/(?<=full_image_text":"<img src=\\")(.*?)(?=\\")/gm)?.[0]?.replaceAll("\\", "") ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}