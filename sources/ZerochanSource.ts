import {AbstractSource} from "./AbstractSource"

export class ZerochanSource extends AbstractSource {
    public matches = (url: string) => {
        return /zerochan\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        let json = await this.fetchJSON(`${url}?json`)
        let image = await this.fetchBuffer(json.full)
        return [image]
    }
}