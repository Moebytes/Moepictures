import {AbstractSource} from "./AbstractSource"

export class DanbooruSource extends AbstractSource {
    public matches = (url: string) => {
        return /danbooru\.donmai\.us/.test(url)
    }

    public extractImages = async (url: string) => {
        const json = await this.fetchJSON(`${url}.json`)
        const image = await this.fetchBuffer(json.file_url)
        return [image]
    }
}