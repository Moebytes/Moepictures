import {AnimePicturesExtractor} from "./AnimePicturesExtractor"
import {ArtstationExtractor} from "./ArtstationExtractor"
import {ArtStreetExtractor} from "./ArtStreetExtractor"
import {DanbooruExtractor} from "./DanbooruExtractor"
import {DeviantArtExtractor} from "./DeviantArtExtractor"
import {EShuushuuExtractor} from "./EShuushuuExtractor"
import {GelbooruExtractor} from "./GelbooruExtractor"
import {ImgurExtractor} from "./ImgurExtractor"
import {NewgroundsExtractor} from "./NewgroundsExtractor"
import {PinterestExtractor} from "./PinterestExtractor"
import {PixivExtractor} from "./PixivExtractor"
import {RedditExtractor} from "./RedditExtractor"
import {SkebExtractor} from "./SkebExtractor"
import {TumblrExtractor} from "./TumblrExtractor"
import {TwitterExtractor} from "./TwitterExtractor"
import {YandereExtractor} from "./YandereExtractor"
import {ZerochanExtractor} from "./ZerochanExtractor"
import functions from "../functions/Functions"

export default class Extractor {
    public static extractImages = async (url: string) => {
        let extractors = [
            new PixivExtractor(url),
            new TwitterExtractor(url),
            new SkebExtractor(url),
            new DeviantArtExtractor(url),
            new ArtstationExtractor(url),
            new RedditExtractor(url),
            new TumblrExtractor(url),
            new NewgroundsExtractor(url),
            new ArtStreetExtractor(url),
            new PinterestExtractor(url),
            new ImgurExtractor(url),
            new DanbooruExtractor(url),
            new GelbooruExtractor(url),
            new ZerochanExtractor(url),
            new YandereExtractor(url),
            new EShuushuuExtractor(url),
            new AnimePicturesExtractor(url)
        ]

        for (const extractor of extractors) {
            if (extractor.matches(url)) {
                try {
                    let images = await extractor.extractImages(url)
                    return images
                } catch {}
            }
        }

        let buffer = await functions.http.getBuffer(url)
        return [buffer]
    }
}