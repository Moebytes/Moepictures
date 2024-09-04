import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import rightIcon from "../assets/icons/right.png"
import leftIcon from "../assets/icons/left.png"
import linkIcon from "../assets/icons/link.png"
import image from "../assets/icons/image.png"
import animation from "../assets/icons/animation.png"
import video from "../assets/icons/video.png"
import comic from "../assets/icons/comic.png"
import audio from "../assets/icons/audio.png"
import model from "../assets/icons/model.png"
import explicit from "../assets/icons/explicit.png"
import questionable from "../assets/icons/questionable.png"
import safe from "../assets/icons/safe.png"
import $2d from "../assets/icons/2d.png"
import $3d from "../assets/icons/3d.png"
import pixel from "../assets/icons/pixel.png"
import chibi from "../assets/icons/chibi.png"
import Carousel from "../components/Carousel"
import PostImage from "../components/PostImage"
import PostModel from "../components/PostModel"
import PostSong from "../components/PostSong"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, ThemeContext, EnableDragContext, HideTitlebarContext, 
UploadDropFilesContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext, MobileContext,
BlurContext, SharpenContext, PixelateContext, HeaderTextContext, SessionContext, SidebarTextContext, RedirectContext,
SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import JSZip from "jszip"
import axios from "axios"
import SearchSuggestions from "../components/SearchSuggestions"
import {ProgressBar} from "react-bootstrap"
import permissions from "../structures/Permissions"
import xButton from "../assets/icons/x-button-magenta.png"
import "./styles/uploadpage.less"
import path from "path"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any

const BulkUploadPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {uploadDropFiles, setUploadDropFiles} = useContext(UploadDropFilesContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [displayImage, setDisplayImage] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [saucenaoError, setSaucenaoError] = useState(false)
    const [danbooruError, setDanbooruError] = useState(false)
    const [acceptedURLs, setAcceptedURLs] = useState([]) as any
    const [dupPosts, setDupPosts] = useState([]) as any
    const uploadErrorRef = useRef<any>(null)
    const submitErrorRef = useRef<any>(null)
    const enterLinksRef = useRef<any>(null)
    const [currentImg, setCurrentImg] = useState(null) as any
    const [currentIndex, setCurrentIndex] = useState(0) as any
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2d")
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [rawArtist, setRawArtist] = useState("")
    const [rawCharacter, setRawCharacter] = useState("")
    const [rawSeries, setRawSeries] = useState("")
    const [artistActive, setArtistActive] = useState(false) as any
    const [characterActive, setCharacterActive] = useState(false) as any
    const [seriesActive, setSeriesActive] = useState(false) as any
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState("")
    const progressBarRef = useRef<any>(null)
    const artistInputRef = useRef(null) as any
    const characterInputRef = useRef(null) as any
    const seriesInputRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Bulk Upload"
        window.scrollTo(0, 0)
        setBrightness(100)
        setContrast(100)
        setHue(180)
        setSaturation(100)
        setLightness(100)
        setBlur(0)
        setSharpen(0)
        setPixelate(1)
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!permissions.isElevated(session)) {
            history.push("/403")
        }
    }, [session])

    useEffect(() => {
        if (uploadDropFiles?.length) {
            validate(uploadDropFiles)
            setUploadDropFiles([])
        }
    }, [uploadDropFiles])

    const validate = async (files: File[], links?: string[]) => {
        let acceptedArray = [] as any 
        let error = ""
        for (let i = 0; i < files.length; i++) {
            const fileReader = new FileReader()
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    const bytes = new Uint8Array(f.target.result)
                    const result = functions.bufferFileType(bytes)?.[0] || {}
                    const jpg = result?.mime === "image/jpeg"
                    const png = result?.mime === "image/png"
                    const gif = result?.mime === "image/gif"
                    const webp = result?.mime === "image/webp"
                    const avif = result?.mime === "image/avif"
                    const mp4 = result?.mime === "video/mp4"
                    const mp3 = result?.mime === "audio/mpeg"
                    const wav = result?.mime === "audio/x-wav"
                    const glb = functions.isGLTF(files[i].name)
                    const fbx = functions.isFBX(files[i].name)
                    const obj = functions.isOBJ(files[i].name)
                    if (glb) result.typename = "glb"
                    if (fbx) result.typename = "fbx"
                    if (obj) result.typename = "obj"
                    const webm = (path.extname(files[i].name) === ".webm" && result?.typename === "mkv")
                    const zip = result?.mime === "application/zip"
                    if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || zip) {
                        const MB = files[i].size / (1024*1024)
                        const maxSize = jpg ? 10 :
                                        png ? 25 :
                                        avif ? 10 :
                                        mp3 ? 25 :
                                        wav ? 50 :
                                        gif ? 100 :
                                        webp ? 100 :
                                        glb ? 100 :
                                        fbx ? 100 :
                                        obj ? 100 :
                                        mp4 ? 300 :
                                        webm ? 300 : 300
                        if (MB <= maxSize) {
                            if (zip) {
                                const reader = new JSZip()
                                const content = await reader.loadAsync(bytes)
                                for (const filename in content.files) {
                                    const file = content.files[filename]
                                    if (file.dir || filename.startsWith("__MACOSX/")) continue
                                    const data = await file.async("uint8array")
                                    const result = functions.bufferFileType(data)?.[0] || {}
                                    const jpg = result?.mime === "image/jpeg"
                                    const png = result?.mime === "image/png"
                                    let webp = result?.mime === "image/webp"
                                    let avif = result?.mime === "image/avif"
                                    const gif = result?.mime === "image/gif"
                                    const mp4 = result?.mime === "video/mp4"
                                    const mp3 = result?.mime === "audio/mpeg"
                                    const wav = result?.mime === "audio/x-wav"
                                    const glb = functions.isGLTF(filename)
                                    const fbx = functions.isFBX(filename)
                                    const obj = functions.isOBJ(filename)
                                    if (glb) result.typename = "glb"
                                    if (fbx) result.typename = "fbx"
                                    if (obj) result.typename = "obj"
                                    const webm = (path.extname(filename) === ".webm" && result?.typename === "mkv")
                                    if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj) {
                                        acceptedArray.push({file: new File([data], filename), ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : null, bytes: data})
                                    } else {
                                        error = `Supported types in zip: png, jpg, webp, avif, gif, mp4, webm, mp3, wav, glb, fbx, obj.`
                                    }
                                }
                                resolve()
                            } else {
                                acceptedArray.push({file: files[i], ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : null, bytes})
                                resolve()
                            }
                        } else {
                            error = `${(result.typename === "mkv" ? "webm" : result.typename).toUpperCase()} max file size: ${maxSize}MB`
                            resolve()
                        }
                    } else {
                        error = `Supported file types: png, jpg, webp, avif, gif, mp4, webm, mp3, wav, glb, fbx, obj, zip.`
                        resolve()
                    }
                }
                fileReader.readAsArrayBuffer(files[i])
            })
        }
        if (acceptedArray.length) {
            let urls = [] as any
            for (let i = 0; i < acceptedArray.length; i++) {
                let url = URL.createObjectURL(acceptedArray[i].file)
                let link = `${url}#.${acceptedArray[i].ext}`
                let thumbnail = ""
                if (acceptedArray[i].ext === "mp4" || acceptedArray[i].ext === "webm") {
                    thumbnail = await functions.videoThumbnail(link)
                } else if (acceptedArray[i].ext === "glb" || acceptedArray[i].ext === "fbx" || acceptedArray[i].ext === "obj") {
                    thumbnail = await functions.modelImage(link)
                } else if (acceptedArray[i].ext === "mp3" || acceptedArray[i].ext === "wav") {
                    thumbnail = await functions.songCover(link)
                }
                urls.push({link, ext: acceptedArray[i].ext, size: acceptedArray[i].file.size, thumbnail,
                originalLink: acceptedArray[i].originalLink, bytes: acceptedArray[i].bytes, name: acceptedArray[i].file.name})
            }
            setCurrentImg(urls[0].link)
            setCurrentIndex(0)
            setAcceptedURLs((prev: any) => [...prev, ...urls])
        }
        if (error) {
            setUploadError(true)
            await functions.timeout(20)
            uploadErrorRef.current.innerText = error
            await functions.timeout(3000)
            setUploadError(false)
        }
    }

    const reset = () => {
        setType("image")
        setRestrict("safe")
        setStyle("2d")
    }

    const upload = async (event: any) => {
        const files = event.target.files
        if (!files?.[0]) return
        await validate(files)
        event.target.value = ""
    }

    const readImage = async (image: string) => {
        const arrayBuffer = await axios.get(`/api/misc/proxy?url=${image}`, {withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
        let bytes = new Uint8Array(arrayBuffer)
        let blob = new Blob([bytes])
        const result = functions.bufferFileType(bytes)?.[0]
        const jpg = result?.mime === "image/jpeg"
        const png = result?.mime === "image/png"
        const gif = result?.mime === "image/gif"
        const webp = result?.mime === "image/webp"
        const avif = result?.mime === "image/avif"
        let ext = jpg ? "jpg" : png ? "png" : gif ? "gif" : webp ? "webp" : avif ? "avif" : null
        if (jpg || png || gif || webp || avif) {
            let url = URL.createObjectURL(blob)
            let croppedURL = ""
            if (gif) {
                const gifData = await functions.extractGIFFrames(url)
                let frameArray = [] as any 
                let delayArray = [] as any
                for (let i = 0; i < gifData.length; i++) {
                    const canvas = gifData[i].frame as HTMLCanvasElement
                    const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                    frameArray.push(cropped)
                    delayArray.push(gifData[i].delay)
                }
                const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1)
                const {width, height} = await functions.imageDimensions(firstURL)
                const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                const blob = new Blob([buffer])
                croppedURL = URL.createObjectURL(blob)
            } else {
                croppedURL = await functions.crop(url, 1)
            }
            const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
            bytes = new Uint8Array(arrayBuffer)
            blob = new Blob([bytes])
            url = URL.createObjectURL(blob)
            return {
                image: `${url}#.${ext}`,
                ext: result.typename,
                bytes: Object.values(bytes)
            }
        }
    }

    const linkUpload = async (event: any) => {
        const links = functions.removeDuplicates(event.target.value.split(/[\n\r\s]+/g).filter((l: string) => l.startsWith("http"))) as string[]
        if (!links?.[0]) return
        clearTimeout(enterLinksTimer)
        enterLinksTimer = setTimeout(async () => {
            let files = [] as any
            for (let i = 0; i < links.length; i++) {
                const file = await functions.proxyImage(links[i])
                files.push(file)
            }
            await validate(files, links)
            reset()
        }, 500)
    }

    const set = (img: string, index: number) => {
        setCurrentImg(img)
        setCurrentIndex(index)
    }

    const clear = () => {
        const currentIndex = acceptedURLs.findIndex((a: any) => a.link === currentImg)
        if (enterLinksRef.current) {
            const link = acceptedURLs[currentIndex]?.originalLink
            if (link) {
                enterLinksRef.current.value = enterLinksRef.current.value.replaceAll(link, "")
            }
            if (!enterLinksRef.current.value.trim()) {
                setShowLinksInput(false)
            }
        }
        acceptedURLs.splice(currentIndex, 1)
        const newIndex = currentIndex > acceptedURLs.length - 1 ? acceptedURLs.length - 1 : currentIndex
        const newLink = acceptedURLs[newIndex]?.link || null
        setAcceptedURLs(acceptedURLs)
        setCurrentImg(newLink)
        forceUpdate()
    }
    
    const left = () => {
        const currentIndex = acceptedURLs.findIndex((a: any) => a.link === currentImg)
        let newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = 0
        acceptedURLs.splice(newIndex, 0, acceptedURLs.splice(currentIndex, 1)[0])
        setAcceptedURLs(acceptedURLs)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const right = () => {
        const currentIndex = acceptedURLs.findIndex((a: any) => a.link === currentImg)
        let newIndex = currentIndex + 1
        if (newIndex > acceptedURLs.length - 1) newIndex = acceptedURLs.length - 1
        acceptedURLs.splice(newIndex, 0, acceptedURLs.splice(currentIndex, 1)[0])
        setAcceptedURLs(acceptedURLs)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const submit = async () => {
        let submitData = [] as any
        for (let i = 0; i < acceptedURLs.length; i++) {
            const current = acceptedURLs[i]
            current.bytes = Object.values(current.bytes)
            let dupes = [] as any
            if (current.thumbnail) {
                const bytes = await functions.base64toUint8Array(current.thumbnail)
                dupes = await axios.post("/api/search/similar", {bytes: Object.values(bytes), type: current.ext}).then((r) => r.data)
            } else {
                dupes = await axios.post("/api/search/similar", {bytes: Object.values(current.bytes), type: current.ext}).then((r) => r.data)
            }
            if (dupes.length) continue
            submitData.push(current)
        }
        if (!submitData.length) {
            setSubmitError(true)
            submitErrorRef.current.innerText = "All of the posts already exist."
            setTimeout(() => {
                setSubmitError(false)
            }, 2000)
            return setProgressText("")
        }
        setProgress(0)
        setProgressText(`0/${submitData.length}`)
        for (let i = 0; i < submitData.length; i++) {
            const current = submitData[i]
            const sourceData = await sourceLookup(current, restrict)
            const tagData = await tagLookup(current, type, style, sourceData.danbooruLink)

            let dataArtists = sourceData.artists?.[0]?.tag ? sourceData.artists : tagData.artists

            const data = {
                images: [current],
                type: tagData.type,
                restrict: sourceData.restrict,
                style: tagData.style,
                thirdPartyID: "",
                source: {
                    title: sourceData.source.title,
                    translatedTitle: sourceData.source.translatedTitle,
                    artist: sourceData.source.artist,
                    date: sourceData.source.date,
                    link: sourceData.source.link,
                    commentary: sourceData.source.commentary,
                    translatedCommentary: sourceData.source.translatedCommentary,
                    bookmarks: sourceData.source.bookmarks,
                    mirrors: sourceData.source.mirrors
                },
                artists: dataArtists,
                characters: tagData.characters,
                series: tagData.series,
                newTags: tagData.newTags,
                tags: tagData.tags,
                duplicates: false,
                noImageUpdate: true
            }

            if (rawArtist?.trim()) {
                const artistArr = functions.cleanHTML(rawArtist).split(/[\n\r\s]+/g)
                let newArtists = [] as any
                for (let i = 0; i < artistArr.length; i++) {
                    newArtists.push({tag: artistArr[i]})
                }
                data.artists = newArtists
            }
            if (rawCharacter?.trim()) {
                const characterArr = functions.cleanHTML(rawCharacter).split(/[\n\r\s]+/g)
                let newCharacters = [] as any
                for (let i = 0; i < characterArr.length; i++) {
                    newCharacters.push({tag: characterArr[i]})
                }
                data.characters = newCharacters
            }
            if (rawSeries?.trim()) {
                const seriesArr = functions.cleanHTML(rawSeries).split(/[\n\r\s]+/g)
                let newSeries = [] as any
                for (let i = 0; i < seriesArr.length; i++) {
                    newSeries.push({tag: seriesArr[i]})
                }
                data.series = newSeries
            }
            try {
                setProgress(Math.floor((100/submitData.length) * (i+1)))
                setProgressText(`${i+1}/${submitData.length}`)
                await axios.post("/api/post/upload", data, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
            } catch (e) {
                console.log(e)
                setSubmitError(true)
                submitErrorRef.current.innerText = `Failed to submit ${data.images[0].name}`
                setTimeout(() => {
                    return setSubmitError(false)
                }, 2000)
            }
        }
        setSubmitted(true)
        setProgress(0)
        setProgressText("")
    }

    const sourceLookup = async (current: any, restrict: string) => {
        let bytes = "" as any 
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((a) => Object.values(a))
        } else {
            bytes = Object.values(current.bytes) as any
        }
        let link = ""
        let artist = ""
        let title = ""
        let translatedTitle = ""
        let commentary = ""
        let translatedCommentary = ""
        let date = ""
        let bookmarks = ""
        let danbooruLink = ""
        let mirrors = [] as any
        let artists = [{}] as any

        let basename = path.basename(current.name, path.extname(current.name)).trim()
        if (/^\d+(?=$|_p)/.test(basename)) {
            const pixivID = basename.match(/^\d+(?=$|_p)/gm)?.[0] ?? ""
            link = `https://www.pixiv.net/en/artworks/${pixivID}`
            const result = await axios.get(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}`).then((r) => r.data)
            if (result.length) danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
            try {
                const illust = await axios.get(`/api/misc/pixiv?url=${link}`, {withCredentials: true}).then((r: any) => r.data)
                commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                date = functions.formatDate(new Date(illust.create_date), true)
                link = illust.url 
                title = illust.title
                artist = illust.user.name
                bookmarks = illust.total_bookmarks
                const translated = await axios.post("/api/misc/translate", [title, commentary], {withCredentials: true}).then((r) => r.data)
                translatedTitle = translated[0]
                translatedCommentary = translated[1]
                if (illust.x_restrict !== 0) {
                    if (restrict === "safe") restrict = "questionable"
                }
                artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await axios.post("/api/misc/romajinize", [artist], {withCredentials: true}).then((r) => r.data[0])
                const imageData = await readImage(illust.user.profile_image_urls.medium)
                artists[artists.length - 1].image = imageData?.image
                artists[artists.length - 1].ext = imageData?.ext
                artists[artists.length - 1].bytes = imageData?.bytes
                artists.push({})
            } catch (e) {
                console.log(e)
            }
            mirrors = await axios.post("/api/misc/boorulinks", {pixivID}, {withCredentials: true}).then((r) => r.data)
            mirrors = mirrors?.length ? mirrors.join("\n") : ""
            return {
                restrict,
                artists,
                danbooruLink,
                source: {
                    title,
                    translatedTitle,
                    artist,
                    link,
                    commentary,
                    translatedCommentary,
                    bookmarks,
                    date,
                    mirrors
                }
            }
        } else {
            let results = await axios.post(`/api/misc/saucenao`, bytes, {withCredentials: true}).then((r) => r.data)
            if (results.length) {
                const pixiv = results.filter((r: any) => r.header.index_id === 5)
                const twitter = results.filter((r: any) => r.header.index_id === 41)
                const artstation = results.filter((r: any) => r.header.index_id === 39)
                const deviantart = results.filter((r: any) => r.header.index_id === 34)
                const danbooru = results.filter((r: any) => r.header.index_id === 9)
                const gelbooru = results.filter((r: any) => r.header.index_id === 25)
                const konachan = results.filter((r: any) => r.header.index_id === 26)
                const yandere = results.filter((r: any) => r.header.index_id === 12)
                const anime = results.filter((r: any) => r.header.index_id === 21)
                if (pixiv.length) mirrors.push(`https://www.pixiv.net/en/artworks/${pixiv[0].data.pixiv_id}`)
                if (twitter.length) mirrors.push(twitter[0].data.ext_urls[0])
                if (deviantart.length) {
                    let redirectedLink = ""
                    try {
                        redirectedLink = await axios.get(`/api/misc/redirect?url=${deviantart[0].data.ext_urls[0]}`, {withCredentials: true}).then((r) => r.data)
                    } catch {
                        // ignore
                    }
                    mirrors.push(redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0])
                }
                if (artstation.length) mirrors.push(artstation[0].data.ext_urls[0])
                if (danbooru.length) mirrors.push(danbooru[0].data.ext_urls[0])
                if (gelbooru.length) mirrors.push(gelbooru[0].data.ext_urls[0])
                if (yandere.length) mirrors.push(yandere[0].data.ext_urls[0])
                if (konachan.length) mirrors.push(konachan[0].data.ext_urls[0])
                if (danbooru.length) danbooruLink = `https://danbooru.donmai.us/posts/${danbooru[0].data.danbooru_id}.json`
                if (pixiv.length) {
                    link = `https://www.pixiv.net/en/artworks/${pixiv[0].data.pixiv_id}`
                    if (!danbooru.length) {
                        const result = await axios.get(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixiv[0].data.pixiv_id}`).then((r) => r.data)
                        if (result.length) danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
                    }
                    artist = pixiv[0].data.author_name
                    title = pixiv[0].data.title
                    try {
                        const illust = await axios.get(`/api/misc/pixiv?url=${link}`, {withCredentials: true}).then((r: any) => r.data)
                        commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                        date = functions.formatDate(new Date(illust.create_date), true)
                        link = illust.url 
                        title = illust.title
                        artist = illust.user.name
                        bookmarks = illust.total_bookmarks
                        const translated = await axios.post("/api/misc/translate", [title, commentary], {withCredentials: true}).then((r) => r.data)
                        translatedTitle = translated[0]
                        translatedCommentary = translated[1]
                        if (illust.x_restrict !== 0) {
                            if (restrict === "safe") restrict = "questionable"
                        }
                        artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await axios.post("/api/misc/romajinize", [artist], {withCredentials: true}).then((r) => r.data[0])
                        const imageData = await readImage(illust.user.profile_image_urls.medium)
                        artists[artists.length - 1].image = imageData?.image
                        artists[artists.length - 1].ext = imageData?.ext
                        artists[artists.length - 1].bytes = imageData?.bytes
                        artists.push({})
                    } catch (e) {
                        console.log(e)
                    }
                } else if (deviantart.length) {
                    let redirectedLink = ""
                    try {
                        redirectedLink = await axios.get(`/api/misc/redirect?url=${deviantart[0].data.ext_urls[0]}`, {withCredentials: true}).then((r) => r.data)
                    } catch {
                        // ignore
                    }
                    link = redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0]
                    artist = deviantart[0].data.member_name 
                    title = deviantart[0].data.title
                    try {
                        const deviation = await axios.get(`/api/misc/deviantart?url=${link}`, {withCredentials: true}).then((r: any) => r.data)
                        title = deviation.title
                        artist = deviation.author.user.username
                        link = deviation.url
                        commentary = deviation.description
                        date = functions.formatDate(new Date(deviation.date), true)
                        if (deviation.rating === "adult") {
                            if (restrict === "safe") restrict = "questionable"
                        }
                        artists[artists.length - 1].tag = artist
                        const imageData = await readImage(deviation.author.user.usericon)
                        artists[artists.length - 1].image = imageData?.image
                        artists[artists.length - 1].ext = imageData?.ext
                        artists[artists.length - 1].bytes = imageData?.bytes
                        artists.push({})
                    } catch (e) {
                        console.log(e)
                    } 
                } else if (anime.length) {
                    title = anime[0].data.source 
                    link = `https://myanimelist.net/anime/${anime[0].data.mal_id}/`
                } else if (twitter.length) {
                    link = twitter[0].data.ext_urls[0]
                    artist = twitter[0].data.twitter_user_handle
                } else if (danbooru.length) {
                    link = danbooru[0].data.ext_urls[0]
                    artist = danbooru[0].data.creator
                    title = danbooru[0].data.characters
                } else if (gelbooru.length) {
                    link = gelbooru[0].data.ext_urls[0]
                    artist = gelbooru[0].data.creator
                    title = gelbooru[0].data.characters
                } else if (yandere.length) {
                    link = yandere[0].data.ext_urls[0]
                    artist = yandere[0].data.creator
                    title = yandere[0].data.characters
                } else if (konachan.length) {
                    link = konachan[0].data.ext_urls[0]
                    artist = konachan[0].data.creator
                    title = konachan[0].data.characters
                }
            }
            mirrors = functions.removeItem(mirrors, link)
            mirrors = mirrors?.length ? mirrors.join("\n") : ""
            return {
                restrict,
                artists,
                danbooruLink,
                source: {
                    title,
                    translatedTitle,
                    artist,
                    link,
                    commentary,
                    translatedCommentary,
                    bookmarks,
                    date,
                    mirrors
                }
            }
        }
    }

    const tagLookup = async (current: any, type: string, style: string, danbooruLink?: string) => {
        let tagArr = [] as any
        let blockedTags = functions.blockedTags()
        let tagReplaceMap = functions.tagReplaceMap()
        let artists = [{}] as any
        let characters = [{}] as any
        let series = [{}] as any
        let tags = [] as any
        let newTags = [] as any
        const tagMap = await functions.tagsCache()

        if (danbooruLink) {
            const json = await axios.get(danbooruLink).then((r) => r.data)
            tagArr = json.tag_string_general.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            tagArr.push("autotags")
            tagArr.push("upscaled")
            let artistStrArr = json.tag_string_artist.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let charStrArr = json.tag_string_character.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let seriesStrArr = json.tag_string_copyright.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            if (seriesStrArr?.includes("original")) {
                charStrArr = ["original"]
                seriesStrArr = ["no-series"]
            }

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("comic")) {
                if (type === "image") type = "comic"
            }

            tagArr = tagArr.map((tag: string) => functions.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            artistStrArr = artistStrArr.map((tag: string) => functions.cleanTag(tag))
            charStrArr = charStrArr.map((tag: string) => functions.cleanTag(tag))
            seriesStrArr = seriesStrArr.map((tag: string) => functions.cleanTag(tag))

            for (let i = 0; i < artistStrArr.length; i++) {
                artists[artists.length - 1].tag = artistStrArr[i]
                artists.push({})
            }

            for (let i = 0; i < charStrArr.length; i++) {
                characters[characters.length - 1].tag = charStrArr[i]
                const seriesName = charStrArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                seriesStrArr.push(seriesName)
                characters.push({})
            }

            seriesStrArr = functions.removeDuplicates(seriesStrArr)

            for (let i = 0; i < seriesStrArr.length; i++) {
                series[series.length - 1].tag = seriesStrArr[i]
                series.push({})
            }

            tags = functions.cleanHTML(tagArr.join(" ")).split(/[\n\r\s]+/g)

            let notExists = [] as any
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], desc: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
            }
            for (let i = 0; i < notExists.length; i++) {
                const index = newTags.findIndex((t: any) => t.tag === notExists[i].tag)
                if (index !== -1) notExists[i] = newTags[index]
            }
            newTags = notExists
        } else {
            let bytes = "" as any 
            if (current.thumbnail) {
                bytes = await functions.base64toUint8Array(current.thumbnail).then((a) => Object.values(a))
            } else {
                bytes = Object.values(current.bytes) as any
            }
            let tagArr = await axios.post(`/api/misc/wdtagger`, bytes, {withCredentials: true}).then((r) => r.data).catch(() => null)
            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("comic")) {
                if (type === "image") type = "comic"
            }

            tagArr = tagArr.map((tag: string) => functions.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)


            let tagMapArr = tagArr.filter((tag: string) => !tag.includes("("))
            tagMapArr.push("autotags")
            tagMapArr.push("needscheck")
            tagMapArr.push("upscaled")
            let charStrArr = tagArr.filter((tag: string) => tag.includes("("))

            let seriesStrArr = [] as string[]

            for (let i = 0; i < charStrArr.length; i++) {
                const seriesName = charStrArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                seriesStrArr.push(seriesName)
            }

            seriesStrArr = functions.removeDuplicates(seriesStrArr)

            for (let i = 0; i < charStrArr.length; i++) {
                characters[characters.length - 1].tag = charStrArr[i]
                characters.push({})
            }

            for (let i = 0; i < seriesStrArr.length; i++) {
                series[series.length - 1].tag = seriesStrArr[i]
                series.push({})
            }
            tags = functions.cleanHTML(tagMapArr.join(" ")).split(/[\n\r\s]+/g)
            let notExists = [] as any
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], desc: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
            }
            for (let i = 0; i < notExists.length; i++) {
                const index = newTags.findIndex((t: any) => t.tag === notExists[i].tag)
                if (index !== -1) notExists[i] = newTags[index]
            }
            newTags = notExists
        }
        return {
            style,
            type,
            artists,
            characters,
            series,
            tags,
            newTags
        }
    }

    const resetAll = () => {
        reset()
        setAcceptedURLs([])
        setCurrentImg(null)
        setCurrentIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
    }

    const getPostJSX = () => {
        if (functions.isModel(currentImg)) {
            return <PostModel model={currentImg} noKeydown={true} noTranslations={true}/>
        } else if (functions.isAudio(currentImg)) {
            return <PostSong audio={currentImg} noKeydown={true} noTranslations={true}/>
        } else {
            return <PostImage img={currentImg} noKeydown={true} noEncryption={true} noTranslations={true}/>
        }
    }

    const getTypeJSX = () => {
        if (mobile) {
            return (
                <>
                <div className="upload-row">
                    <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                        <img className="upload-button-img" src={image}/>
                        <span className="upload-button-text">Image</span>
                    </button>
                    <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                        <img className="upload-button-img" src={animation}/>
                        <span className="upload-button-text">Animation</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                        <img className="upload-button-img" src={video}/>
                        <span className="upload-button-text">Video</span>
                    </button>
                    <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                        <img className="upload-button-img" src={comic}/>
                        <span className="upload-button-text">Comic</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                        <img className="upload-button-img" src={audio}/>
                        <span className="upload-button-text">Audio</span>
                    </button>
                    <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                        <img className="upload-button-img" src={model}/>
                        <span className="upload-button-text">Model</span>
                    </button>
                </div>
                </>
            )
        } else {
            return (
                <>
                <div className="upload-row">
                    <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                        <img className="upload-button-img" src={image}/>
                        <span className="upload-button-text">Image</span>
                    </button>
                    <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                        <img className="upload-button-img" src={animation}/>
                        <span className="upload-button-text">Animation</span>
                    </button>
                    <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                        <img className="upload-button-img" src={video}/>
                        <span className="upload-button-text">Video</span>
                    </button>
                    <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                        <img className="upload-button-img" src={comic}/>
                        <span className="upload-button-text">Comic</span>
                    </button>
                    <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                        <img className="upload-button-img" src={audio}/>
                        <span className="upload-button-text">Audio</span>
                    </button>
                    <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                        <img className="upload-button-img" src={model}/>
                        <span className="upload-button-text">Model</span>
                    </button>
                </div>
                </>
            )
        }
    }

    const getRestrictJSX = () => {
        if (mobile) {
            return (
                <>
                <div className="upload-row">
                    <button className={`upload-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                        <img className="upload-button-img" src={safe}/>
                        <span className="upload-button-text">Safe</span>
                    </button>
                    <button className={`upload-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                        <img className="upload-button-img" src={questionable}/>
                        <span className="upload-button-text">Questionable</span>
                    </button>
                </div>
                <div className="upload-row">
                    {permissions.isElevated(session) ?
                    <button className={`upload-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                        <img className="upload-button-img" src={explicit}/>
                        <span className="upload-button-text">Explicit</span>
                    </button> : null}
                </div> 
                </>
            )
        } else {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                        <img className="upload-button-img" src={safe}/>
                        <span className="upload-button-text">Safe</span>
                    </button>
                    <button className={`upload-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                        <img className="upload-button-img" src={questionable}/>
                        <span className="upload-button-text">Questionable</span>
                    </button>
                    {permissions.isElevated(session) ?
                    <button className={`upload-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                        <img className="upload-button-img" src={explicit}/>
                        <span className="upload-button-text">Explicit</span>
                    </button> : null}
                </div>
            )
        }
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="upload-button-img" src={$3d}/>
                        <span className="upload-button-text">3D</span>
                    </button>
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="upload-button-img" src={chibi}/>
                        <span className="upload-button-text">Chibi</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">Pixel</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="upload-button-img" src={$2d}/>
                        <span className="upload-button-text">2D</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">Pixel</span>
                    </button>
                </div>
            )
        } else {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="upload-button-img" src={$2d}/>
                        <span className="upload-button-text">2D</span>
                    </button>
                    <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="upload-button-img" src={$3d}/>
                        <span className="upload-button-text">3D</span>
                    </button>
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="upload-button-img" src={chibi}/>
                        <span className="upload-button-text">Chibi</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">Pixel</span>
                    </button>
                </div>
            )
        }
    }

    useEffect(() => {
        if (type === "model") {
            if (style === "2d") setStyle("3d")
        } else if (type === "audio") {
            if (style === "3d" || style === "chibi") setStyle("2d")
        }
    }, [type, style])

    const handleArtistClick = (tag: string) => {
        setRawArtist((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    const handleCharacterClick = (tag: string) => {
        setRawCharacter((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }
    
    const handleSeriesClick = (tag: string) => {
        setRawSeries((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ") + " "
        })
    }

    const getX = (kind: string) => {
        if (typeof document === "undefined") return 15
        let element = null as any
        if (kind === "artist") {
            element = artistInputRef?.current
        } else if (kind === "character") {
            element = characterInputRef?.current
        } else if (kind === "series") {
            element = seriesInputRef?.current
        }
        if (!element) return 15
        const rect = element.getBoundingClientRect()
        return rect.left
    }

    const getY = (kind: string) => {
        if (typeof document === "undefined") return 177
        let element = null as any
        if (kind === "artist") {
            element = artistInputRef?.current
        } else if (kind === "character") {
            element = characterInputRef?.current
        } else if (kind === "series") {
            element = seriesInputRef?.current
        }
        if (!element) return 177
        const rect = element.getBoundingClientRect()
        return rect.bottom + window.scrollY
    }

    const updateProgressColor = () => {
        const progressBar = progressBarRef.current?.querySelector(".progress-bar") as HTMLElement
        if (progressBar) {
            const color = functions.rotateColor("#5a56ff", siteHue, siteSaturation, siteLightness)
            progressBar.style.backgroundColor = color
        }
    }

    useEffect(() => {
        updateProgressColor()
    }, [progressText, siteHue, siteSaturation, siteLightness])

    const getUploadJSX = () => {
        if (session.banned) {
            return (
                <>
                <span className="upload-ban-text">You are banned. Cannot upload.</span>
                <button className="upload-button" onClick={() => history.goBack()}
                style={{width: "max-content", marginTop: "10px", marginLeft: "10px", backgroundColor: "var(--banText)"}}>
                        <span className="upload-button-submit-text">←Back</span>
                </button>
                </>
            )
        }
        return (
            <>
            <div className="upload">
                <span className="upload-heading">Bulk Upload</span>
                {submitted ?
                <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text-alt">Posts were uploaded.</span> 
                    </div> 
                    <div className="upload-container-row" style={{marginTop: "10px"}}>
                        <button className="upload-button" onClick={resetAll}>
                                <span className="upload-button-text">←Submit More</span>
                        </button>
                    </div>
                </div> : <>
                {uploadError ? <div className="upload-row"><span ref={uploadErrorRef} className="upload-text-alt"></span></div> : null}
                {mobile ? <>
                <div className="upload-row">
                    <label htmlFor="file-upload" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">Select Files</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                            <img className="upload-button-img" src={linkIcon}/>
                            <span className="upload-button-text">Enter Links</span>
                    </button>
                </div>
                <div className="upload-row">
                    {acceptedURLs.length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <img className="upload-button-img" src={leftIcon}/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <img className="upload-button-img" src={xIcon}/>
                    </button>
                    : null}
                    {acceptedURLs.length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <img className="upload-button-img" src={rightIcon}/>
                    </button> : null}
                </div> </>
                :
                <div className="upload-row">
                    <label htmlFor="file-upload" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">Select Files</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                            <img className="upload-button-img" src={linkIcon}/>
                            <span className="upload-button-text">Enter Links</span>
                    </button>
                    {acceptedURLs.length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <img className="upload-button-img" src={leftIcon}/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <img className="upload-button-img" src={xIcon}/>
                    </button>
                    : null}
                    {acceptedURLs.length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <img className="upload-button-img" src={rightIcon}/>
                    </button> : null}
                </div>}
                {showLinksInput ?
                <div className="upload-row">
                    <textarea ref={enterLinksRef} className="upload-textarea" spellCheck={false} onChange={(event) => linkUpload(event)}
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div> : null}
            {acceptedURLs.length ?
            <div className="upload-row">
                {acceptedURLs.length > 1 ? 
                <div className="upload-container">
                    <Carousel images={acceptedURLs.map((u: any) => u.link)} set={set} index={currentIndex}/>
                    {getPostJSX()}
                </div>
                : getPostJSX()}
            </div>
            : null}
            <span className="upload-heading">Classification</span>
            {getTypeJSX()}
            {getRestrictJSX()}
            {getStyleJSX()}
            <div className="upload-container">
                <SearchSuggestions active={artistActive} x={getX("artist")} y={getY("artist")} width={mobile ? 150 : 200} text={rawArtist} click={handleArtistClick} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">Common Artist: </span>
                    <input ref={artistInputRef} className="upload-input-wide2 artist-tag-color" type="text" value={rawArtist} onChange={(event) => setRawArtist(event.target.value)} spellCheck={false} onFocus={() => setArtistActive(true)} onBlur={() => setArtistActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={characterActive} x={getX("character")} y={getY("character")} width={mobile ? 150 : 200} text={rawCharacter} click={handleCharacterClick} type="character"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">Common Character: </span>
                    <input ref={characterInputRef} className="upload-input-wide2 character-tag-color" type="text" value={rawCharacter} onChange={(event) => setRawCharacter(event.target.value)} spellCheck={false} onFocus={() => setCharacterActive(true)} onBlur={() => setCharacterActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={seriesActive} x={getX("series")} y={getY("series")} width={mobile ? 150 : 200} text={rawSeries} click={handleSeriesClick} type="series"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">Common Series: </span>
                    <input ref={seriesInputRef} className="upload-input-wide2 series-tag-color" type="text" value={rawSeries} onChange={(event) => setRawSeries(event.target.value)} spellCheck={false} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            {progressText ?
            <div className="upload-progress-container">
                <span className="upload-progress-text">{progressText}</span>
                <ProgressBar ref={progressBarRef} animated now={progress} style={{width: "80%", backgroundColor: "var(--progressBG)"}}/>
            </div> : null}
            <div className="upload-center-row">
                {submitError ? <span ref={submitErrorRef} className="submit-error-text"></span> : null}
                <button className="upload-button" onClick={() => submit()}>
                        <span className="upload-button-submit-text">Bulk Upload</span>
                </button>
            </div>
            </>}
            </div>
            <Footer/>
        </>
        )
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {getUploadJSX()}
            </div>
        </div>
        </>
    )
}

export default BulkUploadPage