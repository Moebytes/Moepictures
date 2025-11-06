import {AnimePicturesSource} from "./AnimePicturesSource"
import {ArtstationSource} from "./ArtstationSource"
import {ArtStreetSource} from "./ArtStreetSource"
import {DanbooruSource} from "./DanbooruSource"
import {DeviantArtSource} from "./DeviantArtSource"
import {EShuushuuSource} from "./EShuushuuSource"
import {GelbooruSource} from "./GelbooruSource"
import {ImgurSource} from "./ImgurSource"
import {NewgroundsSource} from "./NewgroundsSource"
import {PinterestSource} from "./PinterestSource"
import {PixivSource} from "./PixivSource"
import {RedditSource} from "./RedditSource"
import {SkebSource} from "./SkebSource"
import {TumblrSource} from "./TumblrSource"
import {TwitterSource} from "./TwitterSource"
import {YandereSource} from "./YandereSource"
import {ZerochanSource} from "./ZerochanSource"
import functions from "../functions/Functions"

export default class Source {
    public static extractImages = async (url: string) => {
        let sources = [
            new PixivSource(url),
            new TwitterSource(url),
            new SkebSource(url),
            new DeviantArtSource(url),
            new ArtstationSource(url),
            new RedditSource(url),
            new TumblrSource(url),
            new NewgroundsSource(url),
            new ArtStreetSource(url),
            new PinterestSource(url),
            new ImgurSource(url),
            new DanbooruSource(url),
            new GelbooruSource(url),
            new ZerochanSource(url),
            new YandereSource(url),
            new EShuushuuSource(url),
            new AnimePicturesSource(url)
        ]

        for (const source of sources) {
            if (source.matches(url)) {
                try {
                    let images = await source.extractImages(url)
                    return images
                } catch {}
            }
        }

        let buffer = await functions.http.getBuffer(url)
        return [buffer]
    }
}