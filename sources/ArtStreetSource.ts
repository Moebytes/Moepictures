import {AbstractSource} from "./AbstractSource"

export class ArtStreetSource extends AbstractSource {
    public matches = (url: string) => {
        return /medibang\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const image = html.match(/(?<=pictureImageUrl = ')(.*?)(?=')/gm)?.[0] ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}