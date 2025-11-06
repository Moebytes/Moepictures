import {AbstractSource} from "./AbstractSource"

export class YandereSource extends AbstractSource {
    public matches = (url: string) => {
        return /yande\.re/.test(url) || /konachan\.com/.test(url) || /konachan\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        let domain = new URL(url).hostname
        let id = url.match(/\d+/g)?.[0]
        const apiLink = `https://${domain}/post.json?tags=id:${id}`
        const json = await this.fetchJSON(apiLink)
        let image = await this.fetchBuffer(json[0].file_url)
        return [image]
    }
}