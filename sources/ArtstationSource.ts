import {AbstractSource} from "./AbstractSource"

export class ArtstationSource extends AbstractSource {
    public matches = (url: string) => {
        return /artstation\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const id = url.match(/(?<=artwork\/)(.*?)(?=$|\/)/g)?.[0]
        const apiLink = `https://www.artstation.com/projects/${id}.json`
        const json = await this.fetchJSON(apiLink)
        let images = [] as Buffer[]
        for (let i = 0; i < json.assets.length; i++) {
            const asset = json.assets[i]
            if (asset.asset_type === "image") {
                const buffer = await this.fetchBuffer(asset.image_url)
                images.push(buffer)
            } else if (asset.asset_type === "video_clip") {
                const iframe = asset.player_embedded.match(/(?<=<iframe src=')(.*?)(?=')/g)?.[0]
                const html = await this.fetchText(iframe)
                const video = html.match(/(?<=src=")(.*?)(?=" type="video)/gm)?.[0] ?? ""
                const response = await this.fetchBuffer(video)
                images.push(response)
            }
        }
        return images
    }
}