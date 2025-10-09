import AudioFunctions from "./AudioFunctions"
import ByteFunctions from "./ByteFunctions"
import CacheFunctions from "./CacheFunctions"
import ColorFunctions from "./ColorFunctions"
import CompareFunctions from "./CompareFunctions"
import ConfigFunctions from "./ConfigFunctions"
import CryptoFunctions from "./CryptoFunctions"
import DateFunctions from "./DateFunctions"
import DOMFunctions from "./DOMFunctions"
import FileFunctions from "./FileFunctions"
import HTTPFunctions from "./HTTPFunctions"
import ImageFunctions from "./ImageFunctions"
import JSXFunctions from "./JSXFunctions"
import LinkFunctions from "./LinkFunctions"
import ModelFunctions from "./ModelFunctions"
import NativeFunctions from "./NativeFunctions"
import PostFunctions from "./PostFunctions"
import RenderFunctions from "./RenderFunctions"
import TagFunctions from "./TagFunctions"
import UtilFunctions from "./UtilFunctions"
import ValidationFunctions from "./ValidationFunctions"
import VideoFunctions from "./VideoFunctions"
import {PostRating} from "../types/Types"

export default class Functions {
    public static audio = AudioFunctions
    public static byte = ByteFunctions
    public static cache = CacheFunctions
    public static color = ColorFunctions
    public static compare = CompareFunctions
    public static config = ConfigFunctions
    public static crypto = CryptoFunctions
    public static date = DateFunctions
    public static dom = DOMFunctions
    public static file = FileFunctions
    public static http = HTTPFunctions
    public static image = ImageFunctions
    public static jsx = JSXFunctions
    public static link = LinkFunctions
    public static model = ModelFunctions
    public static native = NativeFunctions
    public static post = PostFunctions
    public static render = RenderFunctions
    public static tag = TagFunctions
    public static util = UtilFunctions
    public static validation = ValidationFunctions
    public static video = VideoFunctions

    public static timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    public static r18 = () => {
        return "hentai" as PostRating
    }

    public static r17 = () => {
        return "erotic" as PostRating
    }

    public static r15 = () => {
        return "hot" as PostRating
    }

    public static r13 = () => {
        return "cute" as PostRating
    }
}