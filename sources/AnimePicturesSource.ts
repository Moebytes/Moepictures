import {AbstractSource} from "./AbstractSource"

export class AnimePicturesSource extends AbstractSource {
    public matches = (url: string) => {
        return /anime-pictures\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const image = html.match(/(?<=download href=")(.*?)(?=")/gm)?.[0] ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}