import {AbstractSource} from "./AbstractSource"

export class SkebSource extends AbstractSource {
    public get headers() {
        return {
            ...super.headers, 
            "Alt-Used": "skeb.jp",
            Host: "skeb.jp",
            Referer: "https://skeb.jp/", 
            Authorization: `Bearer ${process.env.SKEB_TOKEN}`
        }
    }

    public matches = (url: string) => {
        return /skeb\.jp/.test(url)
    }

    public extractImages = async (url: string) => {
        const [a, b, c, user, d, id] = url.split("/")
        let json = await this.fetchJSON(`https://skeb.jp/api/users/${user.replace("@", "")}/works/${id}`)
        let images = [] as Buffer[]
        for (const preview of json.previews) {
            let buffer = await this.fetchBuffer(preview.url)
            images.push(buffer)
        }
        return images
    }
}