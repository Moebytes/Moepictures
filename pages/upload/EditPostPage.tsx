import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import uploadIcon from "../../assets/icons/upload.png"
import xIcon from "../../assets/icons/x.png"
import rightIcon from "../../assets/icons/right.png"
import leftIcon from "../../assets/icons/left.png"
import linkIcon from "../../assets/icons/link.png"
import upscaleIcon from "../../assets/icons/upscale.png"
import originalIcon from "../../assets/icons/original.png"
import image from "../../assets/icons/image.png"
import animation from "../../assets/icons/animation.png"
import video from "../../assets/icons/video.png"
import comic from "../../assets/icons/comic.png"
import audio from "../../assets/icons/audio.png"
import model from "../../assets/icons/model.png"
import live2d from "../../assets/icons/live2d.png"
import cute from "../../assets/icons/cute.png"
import sexy from "../../assets/icons/sexy.png"
import ecchi from "../../assets/icons/ecchi.png"
import hentai from "../../assets/icons/hentai.png"
import $2d from "../../assets/icons/2d.png"
import $3d from "../../assets/icons/3d.png"
import pixel from "../../assets/icons/pixel.png"
import chibi from "../../assets/icons/chibi.png"
import daki from "../../assets/icons/daki.png"
import sketch from "../../assets/icons/sketch.png"
import lineart from "../../assets/icons/lineart.png"
import promo from "../../assets/icons/promo.png"
import Carousel from "../../components/site/Carousel"
import PostImage from "../../components/image/PostImage"
import PostModel from "../../components/image/PostModel"
import PostLive2D from "../../components/image/PostLive2D"
import PostSong from "../../components/image/PostSong"
import CaptchaDialog from "../../dialogs/misc/CaptchaDialog"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useCacheSelector, useCacheActions, useFilterActions} from "../../store"
import JSZip from "jszip"
import cryptoFunctions from "../../structures/CryptoFunctions"
import ContentEditable from "react-contenteditable"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import permissions from "../../structures/Permissions"
import xButton from "../../assets/icons/x-button-magenta.png"
import tagConvert from "../../assets/json/tag-convert.json"
import {Post, PostFull, PostType, PostRating, PostStyle, UploadTag, UploadImage, UploadImageFile} from "../../types/Types"
import path from "path"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any

interface Props {
    match: {params: {id: string}}
}

const EditPostPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect, setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {showUpscaled} = useSearchSelector()
    const {setShowUpscaled} = useSearchActions()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setPixelate, setBlur, setSharpen} = useFilterActions()
    const {uploadDropFiles} = useCacheSelector()
    const {setUploadDropFiles} = useCacheActions()
    const [displayImage, setDisplayImage] = useState(false)
    const [editPostError, setEditPostError] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [saucenaoError, setSaucenaoError] = useState(false)
    const [danbooruError, setDanbooruError] = useState(false)
    const [originalFiles, setOriginalFiles] = useState([] as UploadImage[])
    const [upscaledFiles, setUpscaledFiles] = useState([] as UploadImage[])
    const editPostErrorRef = useRef<HTMLSpanElement>(null)
    const submitErrorRef = useRef<HTMLSpanElement>(null)
    const saucenaoErrorRef = useRef<HTMLSpanElement>(null)
    const danbooruErrorRef = useRef<HTMLSpanElement>(null)
    const enterLinksRef = useRef<HTMLTextAreaElement>(null)
    const [currentImg, setCurrentImg] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [imgChangeFlag, setImgChangeFlag] = useState(false)
    const [type, setType] = useState("image" as PostType)
    const [rating, setRating] = useState("cute" as PostRating)
    const [style, setStyle] = useState("2d" as PostStyle)
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [parentID, setParentID] = useState("")
    const [sourceTitle, setSourceTitle] = useState("")
    const [sourceEnglishTitle, setSourceEnglishTitle] = useState("")
    const [sourceArtist, setSourceArtist] = useState("")
    const [sourceDate, setSourceDate] = useState("")
    const [sourceLink, setSourceLink] = useState("")
    const [sourceBookmarks, setSourceBookmarks] = useState("")
    const [sourceBuyLink, setSourceBuyLink] = useState("")
    const [sourceCommentary, setSourceCommentary] = useState("")
    const [sourceEnglishCommentary, setSourceEnglishCommentary] = useState("")
    const [sourceMirrors, setSourceMirrors] = useState("")
    const [artists, setArtists] = useState([{}] as UploadTag[])
    const [characters, setCharacters] = useState([{}] as UploadTag[])
    const [series, setSeries] = useState([{}] as UploadTag[])
    const [newTags, setNewTags] = useState([] as UploadTag[])
    const [rawTags, setRawTags] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [artistActive, setArtistActive] = useState([] as boolean[])
    const [artistInputRefs, setArtistInputRefs] = useState(artists.map((a) => React.createRef<HTMLInputElement>()))
    const [characterActive, setCharacterActive] = useState([] as boolean[])
    const [characterInputRefs, setCharacterInputRefs] = useState(characters.map((a) => React.createRef<HTMLInputElement>()))
    const [seriesActive, setSeriesActive] = useState([] as boolean[])
    const [seriesInputRefs, setSeriesInputRefs] = useState(series.map((a) => React.createRef<HTMLInputElement>()))
    const [tagActive, setTagActive] = useState(false)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const rawTagRef = useRef<HTMLDivElement>(null)
    const [edited, setEdited] = useState(false)
    const [reason, setReason] = useState("")
    const [danbooruLink, setDanbooruLink] = useState("")
    const [needsPermission, setNeedsPermission] = useState(false)
    const [postLocked, setPostLocked] = useState(false)
    const postID = props.match.params.id
    const history = useHistory()

    const updateFields = async () => {
        let post = null as PostFull | null
        try {
            post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostFull
        } catch (e: any) {
            if (String(e).includes("401")) return
        }
        if (!post) return functions.replaceLocation("/404")
        setPostLocked(post.locked ?? false)
        setType(post.type)
        setRating(post.rating)
        setStyle(post.style)
        setSourceTitle(post.title || "")
        setSourceEnglishTitle(post.englishTitle || "")
        setSourceArtist(post.artist || "")
        setSourceCommentary(post.commentary || "")
        setSourceEnglishCommentary(post.englishCommentary || "")
        setSourceMirrors(post.mirrors ? Object.values(post.mirrors).join("\n") : "")
        if (post.posted) setSourceDate(functions.formatDate(new Date(post.posted), true))
        setSourceLink(post.source || "")
        setSourceBookmarks(String(post.bookmarks) || "")
        setSourceBuyLink(post.buyLink || "")
        const parentPost = await functions.get("/api/post/parent", {postID}, session, setSessionFlag)
        if (parentPost) setParentID(parentPost.parentID)

        let files = [] as File[]
        let links = [] as string[]
        let upscaledFiles = [] as File[]
        let upscaledLinks = [] as string[]
        for (let i = 0; i < post.images.length; i++) {
            let imageLink = functions.getImageLink(post.images[i].type, postID, post.images[i].order, post.images[i].filename)
            let response = await fetch(`${imageLink}?upscaled=false`, {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            if (response.byteLength) {
                const decrypted = await functions.decryptBuffer(response, imageLink, session)
                const blob = new Blob([new Uint8Array(decrypted)])
                const file = new File([blob], path.basename(imageLink))
                files.push(file)
                links.push(imageLink)
            }
            let upscaledImageLink = functions.getImageLink(post.images[i].type, postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            let upscaledResponse = await fetch(`${upscaledImageLink}?upscaled=true`, {headers: {"x-force-upscale": "true"}}).then((r) => r.arrayBuffer())
            if (upscaledResponse.byteLength) {
                const decrypted = await functions.decryptBuffer(upscaledResponse, upscaledImageLink, session)
                const upscaledBlob = new Blob([new Uint8Array(decrypted)])
                const upscaledFile = new File([upscaledBlob], path.basename(upscaledImageLink))
                upscaledFiles.push(upscaledFile)
                upscaledLinks.push(upscaledImageLink)
            }
        }
        await validate(files, links, false)
        await validate(upscaledFiles, upscaledLinks, true)

        const parsedTags = await functions.parseTags([post], session, setSessionFlag)
        const tagCategories = await functions.tagCategories(parsedTags, session, setSessionFlag)

        let artists = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.artists.length; i++) {
            if (!artists[i]) artists[i] = {}
            artists[i].tag = tagCategories.artists[i].tag
            if (tagCategories.artists[i].image) {
                const imageLink = functions.removeQueryParams(functions.getTagLink("artist", tagCategories.artists[i].image!, tagCategories.artists[i].imageHash))
                artists[i].image = imageLink
                const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                artists[i].ext = path.extname(imageLink).replace(".", "")
                artists[i].bytes = Object.values(new Uint8Array(arrayBuffer))
            }
        }
        setArtists(artists)

        let characters = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.characters.length; i++) {
            if (!characters[i]) characters[i] = {}
            characters[i].tag = tagCategories.characters[i].tag
            if (tagCategories.characters[i].image) {
                const imageLink = functions.removeQueryParams(functions.getTagLink("character", tagCategories.characters[i].image!, tagCategories.characters[i].imageHash))
                characters[i].image = imageLink
                const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                characters[i].ext = path.extname(imageLink).replace(".", "")
                characters[i].bytes = Object.values(new Uint8Array(arrayBuffer))
            }
        }
        setCharacters(characters)

        let series = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.series.length; i++) {
            if (!series[i]) series[i] = {}
            series[i].tag = tagCategories.series[i].tag
            if (tagCategories.series[i].image) {
                const imageLink = functions.removeQueryParams(functions.getTagLink("series", tagCategories.series[i].image!, tagCategories.series[i].imageHash))
                series[i].image = imageLink
                const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                series[i].ext = path.extname(imageLink).replace(".", "")
                series[i].bytes = Object.values(new Uint8Array(arrayBuffer))
            }
        }
        setSeries(series)
        setRawTags(tagCategories.tags.map((t) => t.tag).join(" "))
        setEdited(false)
    }

    useEffect(() => {
        if (!edited) setEdited(true)
    }, [type, rating, style, sourceTitle, sourceArtist, sourceCommentary, sourceEnglishCommentary, sourceMirrors, sourceEnglishTitle,
    sourceLink, sourceBookmarks, sourceBuyLink, sourceDate, originalFiles, upscaledFiles, artists, characters, series, rawTags])

    useEffect(() => {
        if (uploadDropFiles?.length) {
            validate(uploadDropFiles)
            setUploadDropFiles([])
        }
    }, [uploadDropFiles])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)

        setBrightness(100)
        setContrast(100)
        setHue(180)
        setSaturation(100)
        setLightness(100)
        setBlur(0)
        setSharpen(0)
        setPixelate(1)
        updateFields()
    }, [session])

    useEffect(() => {
        document.title = i18n.pages.edit.title
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(`/edit-post/${postID}`)
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const validate = async (files: File[], links?: string[], forceUpscale?: boolean) => {
        let acceptedArray = [] as UploadImageFile[]  
        let error = ""
        let isLive2DArr = [] as boolean[]
        for (let i = 0; i < files.length; i++) {
            const fileReader = new FileReader()
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                    let live2d = false
                    const bytes = new Uint8Array(f.target?.result as ArrayBuffer)
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
                                        glb ? 200 :
                                        fbx ? 200 :
                                        obj ? 200 :
                                        mp4 ? 300 :
                                        webm ? 300 : 300
                        if (MB <= maxSize || permissions.isMod(session)) {
                            if (zip) {
                                live2d = await functions.isLive2DZip(bytes)
                                if (live2d) {
                                    acceptedArray.push({file: files[i], ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : "", bytes: Object.values(bytes)})
                                    resolve()
                                } else {
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
                                        if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav || glb || fbx || obj || live2d) {
                                            acceptedArray.push({file: new File([data], filename), ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : "", bytes: Object.values(data)})
                                        } else {
                                            error = i18n.pages.upload.supportedFiletypesZip
                                        }
                                    }
                                    resolve()
                                }
                            } else {
                                acceptedArray.push({file: files[i], ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : "", bytes: Object.values(bytes)})
                                resolve()
                            }
                        } else {
                            error = `${(result.typename === "mkv" ? "webm" : result.typename).toUpperCase()} ${i18n.pages.upload.maxFileSize}: ${maxSize}MB`
                            resolve()
                        }
                    } else {
                        error = i18n.pages.upload.supportedFiletypes
                        resolve()
                    }
                    isLive2DArr.push(live2d)
                }
                fileReader.readAsArrayBuffer(files[i])
            })
        }
        if (acceptedArray.length) {
            let urls = [] as UploadImage[]
            for (let i = 0; i < acceptedArray.length; i++) {
                let url = URL.createObjectURL(acceptedArray[i].file)
                let link = `${url}#.${acceptedArray[i].ext}`
                let thumbnail = ""
                let width = 0
                let height = 0
                if (isLive2DArr[i]) {
                    thumbnail = await functions.live2dScreenshot(link)
                    let dimensions = await functions.live2dDimensions(link)
                    width = dimensions.width
                    height = dimensions.height
                } else if (functions.isVideo(acceptedArray[i].ext)) {
                    thumbnail = await functions.videoThumbnail(link)
                } else if (functions.isModel(acceptedArray[i].ext)) {
                    thumbnail = await functions.modelImage(link)
                } else if (functions.isAudio(acceptedArray[i].ext)) {
                    thumbnail = await functions.songCover(link)
                }
                urls.push({link, ext: acceptedArray[i].ext, size: acceptedArray[i].file.size, thumbnail, width, height,
                originalLink: acceptedArray[i].originalLink, bytes: acceptedArray[i].bytes, name: acceptedArray[i].file.name})
            }
            setCurrentImg(urls[0].link)
            setCurrentIndex(0)
            if (forceUpscale !== undefined) {
                if (forceUpscale) {
                    setUpscaledFiles((prev) => [...prev, ...urls])
                } else {
                    setOriginalFiles((prev) => [...prev, ...urls])
                }
            } else {
                if (showUpscaled) {
                    setUpscaledFiles((prev) => [...prev, ...urls])
                } else {
                    setOriginalFiles((prev) => [...prev, ...urls])
                }
            }
        }
        if (error) {
            setEditPostError(true)
            if (!editPostErrorRef.current) await functions.timeout(20)
            editPostErrorRef.current!.innerText = error
            await functions.timeout(3000)
            setEditPostError(false)
        }
    }

    const reset = () => {
        setParentID("")
        setSourceTitle("")
        setSourceEnglishTitle("")
        setSourceArtist("")
        setSourceCommentary("")
        setSourceEnglishCommentary("")
        setSourceMirrors("")
        setSourceDate("")
        setSourceLink("")
        setSourceBookmarks("")
        setSourceBuyLink("")
        setRawTags("")
        setDanbooruLink("")
        setArtists([{}])
        setCharacters([{}])
        setSeries([{}])
        setType("image")
        setRating("cute")
        setStyle("2d")
    }

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files?.[0]) return
        await validate(Array.from(files))
        event.target.value = ""
        // reset()
    }

    const uploadTagImg = async (event: File | React.ChangeEvent<HTMLInputElement>, type: string, index: number) => {
        const file = event instanceof File ? event : event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                let bytes = new Uint8Array(f.target?.result as ArrayBuffer)
                const result = functions.bufferFileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                const avif = result?.mime === "image/avif"
                let ext = jpg ? "jpg" : png ? "png" : gif ? "gif" : webp ? "webp" : avif ? "avif" : null
                if (jpg || png || gif || webp || avif) {
                    let url = URL.createObjectURL(file)
                    let croppedURL = ""
                    if (gif) {
                        const gifData = await functions.extractGIFFrames(url)
                        let frameArray = [] as Buffer[] 
                        let delayArray = [] as number[]
                        for (let i = 0; i < gifData.length; i++) {
                            const canvas = gifData[i].frame as HTMLCanvasElement
                            const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                            frameArray.push(cropped)
                            delayArray.push(gifData[i].delay)
                        }
                        const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1, false)
                        const {width, height} = await functions.imageDimensions(firstURL, session)
                        const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                        const blob = new Blob([buffer])
                        croppedURL = URL.createObjectURL(blob)
                    } else {
                        croppedURL = await functions.crop(url, 1, false)
                    }
                    const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                    bytes = new Uint8Array(arrayBuffer)
                    const blob = new Blob([bytes])
                    url = URL.createObjectURL(blob)
                    if (type === "artist") {
                        artists[index].image = `${url}#.${ext}`
                        artists[index].ext = result.typename
                        artists[index].bytes = Object.values(bytes)
                        setArtists(artists)
                    } else if (type === "character") {
                        characters[index].image = `${url}#.${ext}`
                        characters[index].ext = result.typename
                        characters[index].bytes = Object.values(bytes)
                        setCharacters(characters)
                    } else if (type === "series") {
                        series[index].image = `${url}#.${ext}`
                        series[index].ext = result.typename
                        series[index].bytes = Object.values(bytes)
                        setSeries(series)
                    } else if (type === "tag") {
                        newTags[index].image = `${url}#.${ext}`
                        newTags[index].ext = result.typename
                        newTags[index].bytes = Object.values(bytes)
                        setNewTags(newTags)
                    }
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (!(event instanceof File)) event.target.value = ""
        forceUpdate()
    }

    const handleTagClick = async (tag: string, index: number) => {
        const tagDetail = await functions.get("/api/tag", {tag}, session, setSessionFlag).catch(() => null)
        if (!tagDetail) return
        if (tagDetail.image) {
            const tagLink = functions.removeQueryParams(functions.getTagLink(tagDetail.type, tagDetail.image, tagDetail.imageHash))
            const arrayBuffer = await fetch(tagLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            const ext = path.extname(tagLink).replace(".", "")
            if (tagDetail.type === "artist") {
                artists[index].tag = tagDetail.tag
                artists[index].image = tagLink
                artists[index].ext = ext
                artists[index].bytes = Object.values(bytes)
                setArtists(artists)
            } else if (tagDetail.type === "character") {
                characters[index].tag = tagDetail.tag
                characters[index].image = tagLink
                characters[index].ext = ext
                characters[index].bytes = Object.values(bytes)
                setCharacters(characters)
            } else if (tagDetail.type === "series") {
                series[index].tag = tagDetail.tag
                series[index].image = tagLink
                series[index].ext = ext
                series[index].bytes = Object.values(bytes)
                setSeries(series)
            }
        } else {
            if (tagDetail.type === "artist") {
                artists[index].tag = tagDetail.tag
                artists[index].image = ""
                setArtists(artists)
            } else if (tagDetail.type === "character") {
                characters[index].tag = tagDetail.tag
                characters[index].image = ""
                setCharacters(characters)
            } else if (tagDetail.type === "series") {
                series[index].tag = tagDetail.tag
                series[index].image = ""
                setSeries(series)
            }
        }
        forceUpdate()
    }

    const generateArtistsJSX = () => {
        const jsx = [] as React.ReactElement[]
        for (let i = 0; i < artists.length; i++) {
            const changeTagInput = (value: string) => {
                artists[i].tag = value 
                setArtists(artists)
                forceUpdate()
            }
            const changeActive = (value: boolean) => {
                artistActive[i] = value
                setArtistActive(artistActive)
                forceUpdate()
            }
            const deleteImage = () => {
                artists[i].image = "" 
                setArtists(artists)
                forceUpdate()
            }
            const getX = () => {
                if (typeof document === "undefined") return 15
                const element = artistInputRefs[i]?.current
                if (!element) return 15
                const rect = element.getBoundingClientRect()
                return rect.left
            }
        
            const getY = () => {
                if (typeof document === "undefined") return 177
                const element = artistInputRefs[i]?.current
                if (!element) return 177
                const rect = element.getBoundingClientRect()
                return rect.bottom + window.scrollY
            }
            jsx.push(
                <>
                <SearchSuggestions active={artistActive[i]} x={getX()} y={getY()} width={mobile ? 150 : 200} text={artists[i].tag} click={(tag) => handleTagClick(tag, i)} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.artistTag}: </span>
                    <input ref={artistInputRefs[i]} className="upload-input-wide artist-tag-color" type="text" value={artists[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.artistImage}: </span>
                    <label htmlFor={`artist-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`artist-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "artist", i)}/>
                    {artists[i].image ? 
                    <img className="upload-x-button" src={xButton} onClick={() => deleteImage()}/>
                    : null}
                </div>
                {artists[i].image ?
                <div className="upload-container-row">
                    <img className="upload-tag-img" src={artists[i].image}/>
                </div> : null}
                </>
            )
        }
        const add = () => {
            artists.push({})
            artistInputRefs.push(React.createRef())
            setArtists(artists)
            setArtistInputRefs(artistInputRefs)
            forceUpdate()
        }
        const remove = () => {
            artists.pop()
            artistInputRefs.pop()
            setArtists(artists)
            setArtistInputRefs(artistInputRefs)
            forceUpdate()
        }
        jsx.push(
            <div className="upload-container-row">
                <span className="upload-link" onClick={add}>+ {i18n.pages.upload.addArtist}</span>
                {artists.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- {i18n.pages.upload.removeArtist}</span>
                : null}
            </div>
        )
        return jsx
    }

    const generateCharactersJSX = () => {
        const jsx = [] as React.ReactElement[]
        for (let i = 0; i < characters.length; i++) {
            const changeTagInput = (value: string) => {
                characters[i].tag = value 
                setCharacters(characters)
                forceUpdate()
            }
            const changeActive = (value: boolean) => {
                characterActive[i] = value
                setCharacterActive(characterActive)
                forceUpdate()
            }
            const deleteImage = () => {
                characters[i].image = "" 
                setCharacters(characters)
                forceUpdate()
            }
            const getX = () => {
                if (typeof document === "undefined") return 15
                const element = characterInputRefs[i]?.current
                if (!element) return 15
                const rect = element.getBoundingClientRect()
                return rect.left
            }
        
            const getY = () => {
                if (typeof document === "undefined") return 177
                const element = characterInputRefs[i]?.current
                if (!element) return 177
                const rect = element.getBoundingClientRect()
                return rect.bottom + window.scrollY
            }
            jsx.push(
                <>
                <SearchSuggestions active={characterActive[i]} x={getX()} y={getY()} width={mobile ? 110 : 200} text={characters[i].tag} click={(tag) => handleTagClick(tag, i)} type="character"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.characterTag}: </span>
                    <input ref={characterInputRefs[i]} className="upload-input-wide character-tag-color" type="text" value={characters[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.characterImage}: </span>
                    <label htmlFor={`character-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`character-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "character", i)}/>
                    {characters[i].image ? 
                    <img className="upload-x-button" src={xButton} onClick={() => deleteImage()}/>
                    : null}
                </div>
                {characters[i].image ?
                <div className="upload-container-row">
                    <img className="upload-tag-img" src={characters[i].image}/>
                </div> : null}
                </>
            )
        }
        const add = () => {
            characters.push({})
            characterInputRefs.push(React.createRef())
            setCharacters(characters)
            setCharacterInputRefs(characterInputRefs)
            forceUpdate()
        }
        const remove = () => {
            characters.pop()
            characterInputRefs.pop()
            setCharacters(characters)
            setCharacterInputRefs(characterInputRefs)
            forceUpdate()
        }
        jsx.push(
            <div className="upload-container-row">
                <span className="upload-link" onClick={add}>+ {i18n.pages.upload.addCharacter}</span>
                {characters.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- {i18n.pages.upload.removeCharacter}</span>
                : null}
            </div>
        )
        return jsx
    }

    const generateSeriesJSX = () => {
        const jsx = [] as React.ReactElement[]
        for (let i = 0; i < series.length; i++) {
            const changeTagInput = (value: string) => {
                series[i].tag = value 
                setSeries(series)
                forceUpdate()
            }
            const changeActive = (value: boolean) => {
                seriesActive[i] = value
                setSeriesActive(seriesActive)
                forceUpdate()
            }
            const deleteImage = () => {
                series[i].image = "" 
                setSeries(series)
                forceUpdate()
            }
            const getX = () => {
                if (typeof document === "undefined") return 15
                const element = seriesInputRefs[i]?.current
                if (!element) return 15
                const rect = element.getBoundingClientRect()
                return rect.left
            }
        
            const getY = () => {
                if (typeof document === "undefined") return 177
                const element = seriesInputRefs[i]?.current
                if (!element) return 177
                const rect = element.getBoundingClientRect()
                return rect.bottom + window.scrollY
            }
            jsx.push(
                <>
                <SearchSuggestions active={seriesActive[i]} x={getX()} y={getY()} width={mobile ? 140 : 200} text={series[i].tag} click={(tag) => handleTagClick(tag, i)} type="series"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.seriesTag}: </span>
                    <input ref={seriesInputRefs[i]} className="upload-input-wide series-tag-color" type="text" value={series[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.seriesImage}: </span>
                    <label htmlFor={`series-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`series-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "series", i)}/>
                    {series[i].image ? 
                    <img className="upload-x-button" src={xButton} onClick={() => deleteImage()}/>
                    : null}
                </div>
                {series[i].image ?
                <div className="upload-container-row">
                    <img className="upload-tag-img" src={series[i].image}/>
                </div> : null}
                </>
            )
        }
        const add = () => {
            series.push({})
            seriesInputRefs.push(React.createRef())
            setSeries(series)
            setSeriesInputRefs(seriesInputRefs)
            forceUpdate()
        }
        const remove = () => {
            series.pop()
            seriesInputRefs.pop()
            setSeries(series)
            setSeriesInputRefs(seriesInputRefs)
            forceUpdate()
        }
        jsx.push(
            <div className="upload-container-row">
                <span className="upload-link" onClick={add}>+ {i18n.pages.upload.addSeries}</span>
                {series.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- {i18n.pages.upload.removeSeries}</span>
                : null}
            </div>
        )
        return jsx
    }

    const linkUpload = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const links = functions.removeDuplicates(event.target.value.split(/[\n\r\s]+/g).filter((l: string) => l.startsWith("http"))) as string[]
        if (!links?.[0]) return
        clearTimeout(enterLinksTimer)
        enterLinksTimer = setTimeout(async () => {
            let files = [] as File[]
            for (let i = 0; i < links.length; i++) {
                const fileArr = await functions.proxyImage(links[i], session, setSessionFlag)
                files.push(...fileArr)
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
        let currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a) => a.link === currentImg.replace(/\?.*$/, ""))
        if (enterLinksRef.current) {
            const link = currentFiles[currentIndex]?.originalLink
            if (link) {
                enterLinksRef.current.value = enterLinksRef.current.value.replaceAll(link, "")
            }
            if (!enterLinksRef.current.value.trim()) {
                setShowLinksInput(false)
            }
        }
        currentFiles.splice(currentIndex, 1)
        const newIndex = currentIndex > currentFiles.length - 1 ? currentFiles.length - 1 : currentIndex
        const newLink = currentFiles[newIndex]?.link || ""
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentImg(newLink)
        forceUpdate()
    }
    
    const left = () => {
        let currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = 0
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const right = () => {
        let currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex + 1
        if (newIndex > currentFiles.length - 1) newIndex = currentFiles.length - 1
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const submit = async () => {
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\")) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.upload.invalidCharacters
            setRawTags(rawTags.replaceAll("_", "-").replaceAll("/", "-").replaceAll("\\", "-"))
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        if (rawTags.includes(",")) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.upload.spaceSeparation
            const splitTags = functions.cleanHTML(rawTags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
            setRawTags(splitTags.join(" "))
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        const tags = functions.cleanHTML(rawTags).split(/[\n\r\s]+/g)
        if (tags.length < 5 && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.upload.tagMinimum
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        if (!edited && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.edit.noEdits
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        const upscaledMB = upscaledFiles.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const originalMB = originalFiles.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const MB = upscaledMB + originalMB
        if (MB > 300 && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.upload.sizeLimit
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        if (!reason && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.edit.reasonRequired
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        const data = {
            postID,
            images: originalFiles,
            upscaledImages: upscaledFiles,
            type,
            rating,
            style,
            parentID,
            source: {
                title: sourceTitle,
                englishTitle: sourceEnglishTitle,
                artist: sourceArtist,
                posted: sourceDate,
                source: sourceLink,
                commentary: sourceCommentary,
                englishCommentary: sourceEnglishCommentary,
                bookmarks: functions.safeNumber(sourceBookmarks),
                buyLink: sourceBuyLink,
                mirrors: sourceMirrors
            },
            artists,
            characters,
            series,
            newTags,
            tags,
            reason
        }
        setSubmitError(true)
        if (!submitErrorRef.current) await functions.timeout(20)
        submitErrorRef.current!.innerText = i18n.buttons.submitting
        try {
            if (permissions.isContributor(session)) {
                await functions.put("/api/post/edit", data, session, setSessionFlag)
            } else {
                await functions.put("/api/post/edit/unverified", data, session, setSessionFlag)
                setNeedsPermission(true)
            }
            setSubmitted(true)
            functions.clearCache()
            return setSubmitError(false)
        } catch (err: any) {
            if (String(err)?.includes("403")) {
                try {
                    await functions.put("/api/post/edit/unverified", data, session, setSessionFlag)
                    setNeedsPermission(true)
                    setSubmitted(true)
                    return setSubmitError(false)
                } catch (err: any) {
                    let errMsg = i18n.pages.upload.error
                    if (String(err.response?.data).includes("Invalid images")) errMsg = i18n.pages.upload.errorOriginal
                    if (!submitErrorRef.current) await functions.timeout(20)
                    submitErrorRef.current!.innerText = errMsg
                    await functions.timeout(3000)
                    return setSubmitError(false)
                }
            } else {
                let errMsg = i18n.pages.upload.error
                if (String(err.response?.data).includes("Invalid images")) errMsg = i18n.pages.upload.errorOriginal
                if (!submitErrorRef.current) await functions.timeout(20)
                submitErrorRef.current!.innerText = errMsg
                await functions.timeout(3000)
                return setSubmitError(false)
            }
        }
    }

    const sourceLookup = async () => {
        setSaucenaoError(true)
        if (!submitErrorRef.current) await functions.timeout(20)
        saucenaoErrorRef.current!.innerText = i18n.buttons.fetching
        if (saucenaoTimeout) {
            saucenaoErrorRef.current!.innerText = i18n.pages.upload.wait
            await functions.timeout(3000)
            return setSaucenaoError(false)
        }
        const currentFiles = getCurrentFiles()
        let current = currentFiles[currentIndex]
        let bytes = [] as number[]
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((r) => Object.values(r))
        } else {
            bytes = Object.values(current.bytes)
        }
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let date = ""
        let bookmarks = ""
        let mirrors = [] as string[]
        saucenaoTimeout = true
        try {
            let basename = path.basename(current.name, path.extname(current.name)).trim()
            if (/^\d+(?=$|_p)/.test(basename)) {
                const pixivID = basename.match(/^\d+(?=$|_p)/gm)?.[0] ?? ""
                source = `https://www.pixiv.net/artworks/${pixivID}`
                const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}`)
                if (result.length) setDanbooruLink(`https://danbooru.donmai.us/posts/${result[0].id}.json`)
                try {
                    const illust = await functions.get(`/api/misc/pixiv`, {url: source}, session, setSessionFlag)
                    commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                    date = functions.formatDate(new Date(illust.create_date), true)
                    source = illust.url!
                    title = illust.title
                    artist = illust.user.name
                    bookmarks = String(illust.total_bookmarks)
                    const translated = await functions.post("/api/misc/translate", [title, commentary], session, setSessionFlag)
                    englishTitle = translated[0]
                    englishCommentary = translated[1]
                    if (illust.x_restrict !== 0) {
                        if (rating === "cute") setRating("ecchi")
                    }
                    const pfp = await functions.proxyImage(illust.user.profile_image_urls.medium, session, setSessionFlag).then((r) => r[0])
                    artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await functions.post("/api/misc/romajinize", [artist], session, setSessionFlag).then((r) => r[0])
                    await uploadTagImg(pfp, "artist", artists.length - 1)
                    artists.push({})
                    artistInputRefs.push(React.createRef())
                    setArtists(artists)
                    forceUpdate()
                } catch (e) {
                    console.log(e)
                }
                mirrors = await functions.post("/api/misc/boorulinks", {bytes, pixivID}, session, setSessionFlag)
            } else {
                let results = await functions.post(`/api/misc/saucenao`, bytes, session, setSessionFlag)
                if (results.length) {
                    const pixiv = results.filter((r) => r.header.index_id === 5)
                    const twitter = results.filter((r) => r.header.index_id === 41)
                    const artstation = results.filter((r) => r.header.index_id === 39)
                    const deviantart = results.filter((r) => r.header.index_id === 34)
                    const danbooru = results.filter((r) => r.header.index_id === 9)
                    const gelbooru = results.filter((r) => r.header.index_id === 25)
                    const konachan = results.filter((r) => r.header.index_id === 26)
                    const yandere = results.filter((r) => r.header.index_id === 12)
                    const anime = results.filter((r) => r.header.index_id === 21)
                    if (pixiv.length) mirrors.push(`https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`)
                    if (twitter.length) mirrors.push(twitter[0].data.ext_urls[0])
                    if (deviantart.length) {
                        let redirectedLink = ""
                        try {
                            redirectedLink = await functions.get(`/api/misc/redirect`, {url: deviantart[0].data.ext_urls[0]}, session, setSessionFlag)
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
                    if (danbooru.length) setDanbooruLink(`https://danbooru.donmai.us/posts/${danbooru[0].data.danbooru_id}.json`)
                    if (pixiv.length) {
                        source = `https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`
                        if (!danbooru.length) {
                            const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixiv[0].data.pixiv_id}`)
                            if (result.length) setDanbooruLink(`https://danbooru.donmai.us/posts/${result[0].id}.json`)
                        }
                        artist = pixiv[0].data.author_name || ""
                        title = pixiv[0].data.title || ""
                        try {
                            const illust = await functions.get(`/api/misc/pixiv`, {url: source}, session, setSessionFlag)
                            commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                            date = functions.formatDate(new Date(illust.create_date), true)
                            source = illust.url!
                            title = illust.title
                            artist = illust.user.name
                            bookmarks = String(illust.total_bookmarks)
                            const translated = await functions.post("/api/misc/translate", [title, commentary], session, setSessionFlag)
                            englishTitle = translated[0]
                            englishCommentary = translated[1]
                            if (illust.x_restrict !== 0) {
                                setRating("ecchi")
                            } else {
                                setRating("cute")
                            }
                            const pfp = await functions.proxyImage(illust.user.profile_image_urls.medium, session, setSessionFlag).then((r) => r[0])
                            artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await functions.post("/api/misc/romajinize", [artist], session, setSessionFlag).then((r) => r[0])
                            await uploadTagImg(pfp, "artist", artists.length - 1)
                            artists.push({})
                            artistInputRefs.push(React.createRef())
                            setArtists(artists)
                            forceUpdate()
                        } catch (e) {
                            console.log(e)
                        }
                    } else if (deviantart.length) {
                        let redirectedLink = ""
                        try {
                            redirectedLink = await functions.get(`/api/misc/redirect`, {url: deviantart[0].data.ext_urls[0]}, session, setSessionFlag)
                        } catch {
                            // ignore
                        }
                        source = redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0]
                        artist = deviantart[0].data.member_name || ""
                        title = deviantart[0].data.title || ""
                        try {
                            const deviation = await functions.get(`/api/misc/deviantart`, {url: source}, session, setSessionFlag)
                            title = deviation.title
                            artist = deviation.author.user.username
                            source = deviation.url
                            commentary = deviation.description
                            date = functions.formatDate(new Date(deviation.date), true)
                            if (deviation.rating === "adult") {
                                setRating("ecchi")
                            } else {
                                setRating("cute")
                            }
                            const pfp = await functions.proxyImage(deviation.author.user.usericon, session, setSessionFlag).then((r) => r[0])
                            artists[artists.length - 1].tag = artist
                            await uploadTagImg(pfp, "artist", artists.length - 1)
                            artists.push({})
                            artistInputRefs.push(React.createRef())
                            setArtists(artists)
                            forceUpdate()
                            // setRawTags(deviation.keywords.map((k: string) => k.toLowerCase()).join(" "))
                        } catch (e) {
                            console.log(e)
                        } 
                    } else if (anime.length) {
                        title = anime[0].data.source || ""
                        source = `https://myanimelist.net/anime/${anime[0].data.mal_id}/`
                    } else if (twitter.length) {
                        source = twitter[0].data.ext_urls[0]
                        artist = twitter[0].data.twitter_user_handle || ""
                    } else if (danbooru.length) {
                        source = danbooru[0].data.ext_urls[0]
                        artist = danbooru[0].data.creator || ""
                        title = danbooru[0].data.characters || ""
                    } else if (gelbooru.length) {
                        source = gelbooru[0].data.ext_urls[0]
                        artist = gelbooru[0].data.creator || ""
                        title = gelbooru[0].data.characters || ""
                    } else if (yandere.length) {
                        source = yandere[0].data.ext_urls[0]
                        artist = yandere[0].data.creator || ""
                        title = yandere[0].data.characters || ""
                    } else if (konachan.length) {
                        source = konachan[0].data.ext_urls[0]
                        artist = konachan[0].data.creator || ""
                        title = konachan[0].data.characters || ""
                    }
                }
            }
            setSourceTitle(title)
            setSourceEnglishTitle(englishTitle)
            setSourceArtist(artist)
            setSourceLink(source)
            setSourceCommentary(commentary)
            setSourceEnglishCommentary(englishCommentary)
            setSourceBookmarks(bookmarks)
            setSourceDate(date)
            mirrors = functions.removeItem(mirrors, source)
            setSourceMirrors(mirrors.join("\n"))
            if (!title && !artist && !source) {
                saucenaoErrorRef.current!.innerText = i18n.pages.upload.noResults
                await functions.timeout(3000)
            }
            setSaucenaoError(false)
        } catch (e) {
            console.log(e)
            if (!saucenaoErrorRef.current) await functions.timeout(20)
            saucenaoErrorRef.current!.innerText = i18n.pages.upload.noResults
            await functions.timeout(3000)
            setSaucenaoError(false)
        }
        setTimeout(async () => {
            saucenaoTimeout = false
        }, 3000)
    }

    const tagLookup = async () => {
        setDanbooruError(true)
        await functions.timeout(20)
        if (!danbooruErrorRef.current) await functions.timeout(20)
        danbooruErrorRef.current!.innerText = i18n.buttons.fetching
        let tagArr = [] as string[]

        let blockedTags = tagConvert.blockedTags
        let tagReplaceMap = tagConvert.tagReplaceMap

        const currentFiles = getCurrentFiles()
        let current = currentFiles[currentIndex]
        let bytes = [] as number[]
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((r) => Object.values(r))
        } else {
            bytes = current.bytes
        }

        try {
            let danLink = danbooruLink
            if (!danLink) danLink = await functions.post(`/api/misc/revdanbooru`, bytes, session, setSessionFlag)
            if (danLink) {
                setDanbooruLink(danLink)
                const json = await functions.fetch(danLink)
                tagArr = json.tag_string_general.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
                tagArr.push("autotags")
                if (upscaledFiles.length) tagArr.push("upscaled")
                let charStrArr = json.tag_string_character.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
                let seriesStrArr = json.tag_string_copyright.split(" ").map((tag: string) => tag.replaceAll("_", "-"))

                if (tagArr.includes("chibi")) setStyle("chibi")
                if (tagArr.includes("pixel-art")) setStyle("pixel")
                if (tagArr.includes("dakimakura")) setStyle("daki")
                if (tagArr.includes("sketch")) setStyle("sketch")
                if (tagArr.includes("lineart")) setStyle("lineart")
                if (tagArr.includes("ad")) setStyle("promo")
                if (tagArr.includes("comic")) setType("comic")

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

                charStrArr = charStrArr.map((tag: string) => functions.cleanTag(tag))
                seriesStrArr = seriesStrArr.map((tag: string) => functions.cleanTag(tag))

                for (let i = 0; i < charStrArr.length; i++) {
                    characters[characters.length - 1].tag = charStrArr[i]
                    const seriesName = charStrArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                    seriesStrArr.push(seriesName)
                    const tagDetail = await functions.get("/api/tag", {tag: charStrArr[i]}, session, setSessionFlag).catch(() => null)
                    if (tagDetail?.image) {
                        const tagLink = functions.removeQueryParams(functions.getTagLink(tagDetail.type, tagDetail.image, tagDetail.imageHash))
                        const arrayBuffer = await fetch(tagLink).then((r) => r.arrayBuffer())
                        const bytes = new Uint8Array(arrayBuffer)
                        const ext = path.extname(tagLink).replace(".", "")
                        characters[characters.length - 1].image = tagLink
                        characters[characters.length - 1].ext = ext
                        characters[characters.length - 1].bytes = Object.values(bytes)
                    }
                    characters.push({})
                    characterInputRefs.push(React.createRef())
                    setCharacters(characters)
                    forceUpdate()
                }

                seriesStrArr = functions.removeDuplicates(seriesStrArr)

                for (let i = 0; i < seriesStrArr.length; i++) {
                    series[series.length - 1].tag = seriesStrArr[i]
                    const tagDetail = await functions.get("/api/tag", {tag: seriesStrArr[i]}, session, setSessionFlag).catch(() => null)
                    if (tagDetail?.image) {
                        const tagLink = functions.removeQueryParams(functions.getTagLink(tagDetail.type, tagDetail.image, tagDetail.imageHash))
                        const arrayBuffer = await fetch(tagLink).then((r) => r.arrayBuffer())
                        const bytes = new Uint8Array(arrayBuffer)
                        const ext = path.extname(tagLink).replace(".", "")
                        series[series.length - 1].image = tagLink
                        series[series.length - 1].ext = ext
                        series[series.length - 1].bytes = Object.values(bytes)
                    }
                    series.push({})
                    seriesInputRefs.push(React.createRef())
                    setSeries(series)
                    forceUpdate()
                }

                setRawTags(tagArr.join(" "))
            } else {
                let result = await functions.post(`/api/misc/wdtagger`, bytes, session, setSessionFlag).catch(() => null)
                if (!result) return

                let tagArr = result.tags
                let characterArr = result.characters

                if (tagArr.includes("chibi")) setStyle("chibi")
                if (tagArr.includes("pixel-art")) setStyle("pixel")
                if (tagArr.includes("dakimakura")) setStyle("daki")
                if (tagArr.includes("sketch")) setStyle("sketch")
                if (tagArr.includes("lineart")) setStyle("lineart")
                if (tagArr.includes("ad")) setStyle("promo")
                if (tagArr.includes("comic")) setType("comic")

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

                characterArr = characterArr.map((tag: string) => functions.cleanTag(tag))
                for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                    const key = Object.keys(tagReplaceMap)[i]
                    const value = Object.values(tagReplaceMap)[i]
                    characterArr = characterArr.map((tag: string) => tag.replaceAll(key, value))
                }
                for (let i = 0; i < blockedTags.length; i++) {
                    characterArr = characterArr.filter((tag: string) => !tag.includes(blockedTags[i]))
                }
                characterArr = characterArr.filter((tag: string) => tag.length >= 3)


                tagArr.push("autotags")
                tagArr.push("needscheck")
                if (upscaledFiles.length) tagArr.push("upscaled")

                let seriesArr = [] as string[]

                for (let i = 0; i < characterArr.length; i++) {
                    const seriesName = characterArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "") || ""
                    seriesArr.push(seriesName)
                }

                seriesArr = functions.removeDuplicates(seriesArr)

                for (let i = 0; i < characterArr.length; i++) {
                    characters[characters.length - 1].tag = characterArr[i]
                    const tagDetail = await functions.get("/api/tag", {tag: characterArr[i]}, session, setSessionFlag).catch(() => null)
                    if (tagDetail?.image) {
                        const tagLink = functions.removeQueryParams(functions.getTagLink(tagDetail.type, tagDetail.image, tagDetail.imageHash))
                        const arrayBuffer = await fetch(tagLink).then((r) => r.arrayBuffer())
                        const bytes = new Uint8Array(arrayBuffer)
                        const ext = path.extname(tagLink).replace(".", "")
                        characters[characters.length - 1].image = tagLink
                        characters[characters.length - 1].ext = ext
                        characters[characters.length - 1].bytes = Object.values(bytes)
                    }
                    characters.push({})
                    characterInputRefs.push(React.createRef())
                    setCharacters(characters)
                    forceUpdate()
                }

                for (let i = 0; i < seriesArr.length; i++) {
                    series[series.length - 1].tag = seriesArr[i]
                    const tagDetail = await functions.get("/api/tag", {tag: seriesArr[i]}, session, setSessionFlag).catch(() => null)
                    if (tagDetail?.image) {
                        const tagLink = functions.removeQueryParams(functions.getTagLink(tagDetail.type, tagDetail.image, tagDetail.imageHash))
                        const arrayBuffer = await fetch(tagLink).then((r) => r.arrayBuffer())
                        const bytes = new Uint8Array(arrayBuffer)
                        const ext = path.extname(tagLink).replace(".", "")
                        series[series.length - 1].image = tagLink
                        series[series.length - 1].ext = ext
                        series[series.length - 1].bytes = Object.values(bytes)
                    }
                    series.push({})
                    seriesInputRefs.push(React.createRef())
                    setSeries(series)
                    forceUpdate()
                }

                setRawTags(tagArr.join(" "))
            }
            setDanbooruError(false)
        } catch (e) {
            console.log(e)
            if (!danbooruErrorRef.current) await functions.timeout(20)
            danbooruErrorRef.current!.innerText = i18n.pages.upload.nothingFound
            await functions.timeout(3000)
            setDanbooruError(false)
        }
    }

    const resetAll = () => {
        reset()
        setOriginalFiles([])
        setUpscaledFiles([])
        setCurrentImg("")
        setCurrentIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
        setNeedsPermission(false)
    }

    useEffect(() => {
        updateTags()
    }, [rawTags, session])

    const updateTags = async () => {
        const tags = functions.removeDuplicates(functions.cleanHTML(rawTags).trim().split(/[\n\r\s]+/g).map((t) => t.trim().toLowerCase())) as string[]
        clearTimeout(tagsTimer)
        tagsTimer = setTimeout(async () => {
            if (!tags?.[0]) return setNewTags([])
            const tagMap = await functions.tagsCache(session, setSessionFlag)
            let notExists = [] as UploadTag[]
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], desc: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
            }
            for (let i = 0; i < notExists.length; i++) {
                const index = newTags.findIndex((t) => t.tag === notExists[i].tag)
                if (index !== -1) notExists[i] = newTags[index]
            }
            setNewTags(notExists)
        }, 500)
    }

    const generateTagsJSX = () => {
        const jsx = [] as React.ReactElement[]
        for (let i = 0; i < newTags.length; i++) {
            const changeTagDesc = (value: string) => {
                newTags[i].desc = value 
                setNewTags(newTags)
                forceUpdate()
            }
            const deleteImage = () => {
                newTags[i].image = "" 
                setNewTags(newTags)
                forceUpdate()
            }
            jsx.push(
                <>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.tag.tag}: </span>
                    <span className="upload-text" style={{marginLeft: "10px"}}>{newTags[i].tag}</span>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.description}: </span>
                </div>
                <div className="upload-container-row">
                <textarea className="upload-textarea-small" style={{height: "80px"}} value={newTags[i].desc} onChange={(event) => changeTagDesc(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.optionalTagImage}: </span>
                    <label htmlFor={`tag-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`tag-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "tag", i)}/>
                    {newTags[i].image ? 
                    <img className="upload-x-button" src={xButton} onClick={() => deleteImage()}/>
                    : null}
                </div>
                {newTags[i].image ?
                <div className="upload-container-row">
                    <img className="upload-tag-img" src={newTags[i].image}/>
                </div> : null}
                </>
            )
        }
        return jsx
    }

    const getTagX = () => {
        if (typeof window === "undefined") return 0
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = functions.rangeRect(range)
            return rect.left - 10
        }
        return 0
    }

    const getTagY = () => {
        if (typeof window === "undefined") return 0
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = functions.rangeRect(range)
            return rect.bottom + window.scrollY + 10
        }
        return 0
    }

    useEffect(() => {
        const tagX = getTagX()
        const tagY = getTagY()
        setTagX(tagX)
        setTagY(tagY)
    }, [rawTags])

    useEffect(() => {
        if (tagActive) {
            const tagX = getTagX()
            const tagY = getTagY()
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [tagActive])
    
    const handleRawTagClick = (tag: string) => {
        setRawTags((prev: string) => {
            const parts = functions.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    const getPostJSX = () => {
        if (functions.isLive2D(currentImg)) {
            return <PostLive2D live2d={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.isModel(currentImg)) {
            return <PostModel model={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.isAudio(currentImg)) {
            return <PostSong audio={currentImg} noKeydown={true} noNotes={true}/>
        } else {
            return <PostImage img={currentImg} noKeydown={true} noEncryption={true} noNotes={true}/>
        }
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="upload-button-img" src={$3d}/>
                        <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button>
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="upload-button-img" src={chibi}/>
                        <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <img className="upload-button-img" src={$2d}/>
                        <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <img className="upload-button-img" src={sketch}/>
                        <span className="upload-button-text">{i18n.sortbar.style.sketch}</span>
                    </button>
                </div>
            )
        } else {
            if (mobile) {
                return (
                    <>
                    <div className="upload-row">
                        <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                            <img className="upload-button-img" src={$2d}/>
                            <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                        </button>
                        {type !== "live2d" ? <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                            <img className="upload-button-img" src={$3d}/>
                            <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                        </button> : null}
                        <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                            <img className="upload-button-img" src={chibi}/>
                            <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                        </button>
                        <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                            <img className="upload-button-img" src={pixel}/>
                            <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                        </button>
                    </div>
                    <div className="upload-row">
                        {type !== "comic" ?
                        <button className={`upload-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                            <img className="upload-button-img" src={daki}/>
                            <span className="upload-button-text">{i18n.sortbar.style.daki}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                            <img className="upload-button-img" src={promo}/>
                            <span className="upload-button-text">{i18n.sortbar.style.promo}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                            <img className="upload-button-img" src={sketch}/>
                            <span className="upload-button-text">{i18n.sortbar.style.sketch}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                            <img className="upload-button-img" src={lineart}/>
                            <span className="upload-button-text">{i18n.sortbar.style.lineart}</span>
                        </button> : null}
                    </div>
                    </>
                )
            } else {
                return (
                    <div className="upload-row">
                        <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                            <img className="upload-button-img" src={$2d}/>
                            <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                        </button>
                        {type !== "live2d" ? <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                            <img className="upload-button-img" src={$3d}/>
                            <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                        </button> : null}
                        <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                            <img className="upload-button-img" src={chibi}/>
                            <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                        </button>
                        <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                            <img className="upload-button-img" src={pixel}/>
                            <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                        </button>
                        {type !== "comic" ?
                        <button className={`upload-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                            <img className="upload-button-img" src={daki}/>
                            <span className="upload-button-text">{i18n.sortbar.style.daki}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                            <img className="upload-button-img" src={promo}/>
                            <span className="upload-button-text">{i18n.sortbar.style.promo}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                            <img className="upload-button-img" src={sketch}/>
                            <span className="upload-button-text">{i18n.sortbar.style.sketch}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                            <img className="upload-button-img" src={lineart}/>
                            <span className="upload-button-text">{i18n.sortbar.style.lineart}</span>
                        </button> : null}
                    </div>
                )
            }
        }
    }

    useEffect(() => {
        if (type === "comic") {
            if (style === "daki") setStyle("2d")
        } else if (type === "model") {
            if (style === "2d" || style === "daki" || style === "sketch" || style === "lineart" || style === "promo") setStyle("3d")
        } else if (type === "live2d") {
            if (style === "3d" || style === "sketch" || style === "lineart" || style === "promo") setStyle("2d")
        } else if (type === "audio") {
            if (style === "3d" || style === "chibi" || style === "daki" || style === "lineart" || style === "promo") setStyle("2d")
        }
    }, [type, style])

    useEffect(() => {
        if (imgChangeFlag) {
            const currentFiles = getCurrentFiles()
            let index = currentIndex
            let current = currentFiles[index]
            if (!current) {
                current = currentFiles[0]
                index = 0
            }
            setCurrentImg(current?.link || "")
            setCurrentIndex(index)
            setImgChangeFlag(false)
        }
    }, [imgChangeFlag, showUpscaled, currentIndex, originalFiles, upscaledFiles])

    useEffect(() => {
        setTimeout(() => {
            setImgChangeFlag(true)
        }, 200)
    }, [])

    const getCurrentFiles = () => {
        return showUpscaled ? upscaledFiles : originalFiles
    }

    const changeUpscaled = () => {
        setShowUpscaled(!showUpscaled)
        setImgChangeFlag(true)
    }

    const getEditPostJSX = () => {
        if (session.banned) {
            return (
                <>
                <span className="upload-ban-text">{i18n.pages.edit.banText}</span>
                <button className="upload-button" onClick={() => history.goBack()}
                style={{width: "max-content", marginTop: "10px", marginLeft: "10px", backgroundColor: "var(--banText)"}}>
                        <span className="upload-button-submit-text">←{i18n.buttons.back}</span>
                </button>
                </>
            )
        }

        if (postLocked) {
            return (
                <>
                <span className="upload-ban-text">{i18n.pages.edit.locked}</span>
                <button className="upload-button" onClick={() => history.goBack()}
                style={{width: "max-content", marginTop: "10px", marginLeft: "10px", backgroundColor: "var(--banText)"}}>
                        <span className="upload-button-submit-text">←{i18n.buttons.back}</span>
                </button>
                </>
            )
        }

        return (
            <>
            <div className="upload">
                <span className="upload-heading">{i18n.pages.edit.title}</span>
                {submitted ?
                <div className="upload-container">
                    <div className="upload-container-row">
                        {needsPermission ?
                        <span className="upload-text-alt">{i18n.pages.edit.submitHeadingApproval}</span> :
                        <span className="upload-text-alt">{i18n.pages.edit.submitHeading}</span>}
                    </div> 
                    <div className="upload-container-row" style={{marginTop: "10px"}}>
                        <button className="upload-button" onClick={() => {history.push(`/post/${postID}`); setPostFlag(true)}}>
                                <span className="upload-button-text">←{i18n.buttons.back}</span>
                        </button>
                    </div>
                </div> : <>
                {editPostError ? <div className="upload-row"><span ref={editPostErrorRef} className="upload-text-alt"></span></div> : null}
                {mobile ? <>
                <div className="upload-row">
                    <label htmlFor="file-editpost" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-editpost" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                            <img className="upload-button-img" src={linkIcon}/>
                            <span className="upload-button-text">{i18n.labels.enterLinks}</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                            <img className="upload-button-img" src={showUpscaled ? upscaleIcon : originalIcon}/>
                            <span className="upload-button-text">{showUpscaled ? i18n.labels.upscaled : i18n.labels.original}</span>
                    </button>
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <img className="upload-button-img" src={leftIcon}/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <img className="upload-button-img" src={xIcon}/>
                    </button>
                    : null}
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <img className="upload-button-img" src={rightIcon}/>
                    </button> : null}
                </div> </>
                :
                <div className="upload-row">
                    <label htmlFor="file-editpost" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-editpost" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                            <img className="upload-button-img" src={linkIcon}/>
                            <span className="upload-button-text">{i18n.labels.enterLinks}</span>
                    </button>
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                            <img className="upload-button-img" src={showUpscaled ? upscaleIcon : originalIcon}/>
                            <span className="upload-button-text">{showUpscaled ? i18n.labels.upscaled : i18n.labels.original}</span>
                    </button>
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <img className="upload-button-img" src={leftIcon}/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <img className="upload-button-img" src={xIcon}/>
                    </button>
                    : null}
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <img className="upload-button-img" src={rightIcon}/>
                    </button> : null}
                </div>}
                {showLinksInput ?
                <div className="upload-row">
                    <textarea ref={enterLinksRef} className="upload-textarea" spellCheck={false} onChange={(event) => linkUpload(event)}
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div> : null}
            {getCurrentFiles().length ?
            <div className="upload-row">
                {getCurrentFiles().length > 1 ? 
                <div className="upload-container">
                    <Carousel images={getCurrentFiles().map((u) => `${u.link}?upscaled=${showUpscaled}`)} set={set} index={currentIndex}/>
                    {getPostJSX()}
                </div>
                : getPostJSX()}
            </div>
            : null}
            <span className="upload-heading">{i18n.pages.upload.classification}</span>
            <span className="upload-text-alt">{i18n.pages.upload.multipleHeading}</span>
            {mobile ? <>
            <div className="upload-row">
                <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="upload-button-img" src={image}/>
                    <span className="upload-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="upload-button-img" src={animation}/>
                    <span className="upload-button-text">{i18n.sortbar.type.animation}</span>
                </button>
            </div>
            <div className="upload-row">
                <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="upload-button-img" src={video}/>
                    <span className="upload-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="upload-button-img" src={comic}/>
                    <span className="upload-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="upload-row">
                <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="upload-button-img" src={audio}/>
                    <span className="upload-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="upload-button-img" src={live2d}/>
                    <span className="upload-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
            </div> 
            <div className="upload-row">
                <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="upload-button-img" src={model}/>
                    <span className="upload-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div> </>
            :
            <div className="upload-row">
                <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <img className="upload-button-img" src={image}/>
                    <span className="upload-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <img className="upload-button-img" src={animation}/>
                    <span className="upload-button-text">{i18n.sortbar.type.animation}</span>
                </button>
                <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <img className="upload-button-img" src={video}/>
                    <span className="upload-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <img className="upload-button-img" src={comic}/>
                    <span className="upload-button-text">{i18n.sortbar.type.comic}</span>
                </button>
                <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <img className="upload-button-img" src={audio}/>
                    <span className="upload-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <img className="upload-button-img" src={model}/>
                    <span className="upload-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div>}
            {mobile ? <>
            <div className="upload-row">
                <button className={`upload-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <img className="upload-button-img" src={cute}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`upload-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <img className="upload-button-img" src={sexy}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`upload-button ${rating === "ecchi" ? "button-selected" : ""}`} onClick={() => setRating("ecchi")}>
                    <img className="upload-button-img" src={ecchi}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.ecchi}</span>
                </button>
            </div>
            <div className="upload-row">
                {session.showR18 ?
                <button className={`upload-button ${rating === "hentai" ? "button-selected" : ""}`} onClick={() => setRating("hentai")}>
                    <img className="upload-button-img" src={hentai}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.hentai}</span>
                </button> : null}
            </div> </>
            :
            <div className="upload-row">
                <button className={`upload-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <img className="upload-button-img" src={cute}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`upload-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <img className="upload-button-img" src={sexy}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`upload-button ${rating === "ecchi" ? "button-selected" : ""}`} onClick={() => setRating("ecchi")}>
                    <img className="upload-button-img" src={ecchi}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.ecchi}</span>
                </button>
                {session.showR18 ?
                <button className={`upload-button ${rating === "hentai" ? "button-selected" : ""}`} onClick={() => setRating("hentai")}>
                    <img className="upload-button-img" src={hentai}/>
                    <span className="upload-button-text">{i18n.sortbar.rating.hentai}</span>
                </button> : null}
            </div>}
            {getStyleJSX()}
            <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text-alt">{i18n.pages.upload.childHeading}</span>
                        <input className="upload-input" type="number" value={parentID} onChange={(event) => setParentID(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
            </div>
            <span className="upload-heading">{i18n.labels.source}</span>
            <div className="upload-container">
                {saucenaoError ? <span ref={saucenaoErrorRef} className="submit-error-text"></span> : null}
                <span className="upload-link" onClick={sourceLookup}>{i18n.pages.upload.fetchFromPixiv}</span>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.title}: </span>
                    <input className="upload-input-wide2" type="text" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.englishTitle}: </span>
                    <input className="upload-input-wide2" type="text" value={sourceEnglishTitle} onChange={(event) => setSourceEnglishTitle(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.tag.artist}: </span>
                    <input className="upload-input-wide" type="text" value={sourceArtist} onChange={(event) => setSourceArtist(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.sort.posted}: </span>
                    <input className="upload-input-wide" type="date" value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.source}: </span>
                    <input className="upload-input-wide2" type="url" value={sourceLink} onChange={(event) => setSourceLink(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.sort.bookmarks}: </span>
                    <input className="upload-input-wide" type="number" value={sourceBookmarks} onChange={(event) => setSourceBookmarks(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.buyLink}: </span>
                    <input className="upload-input-wide2" type="url" value={sourceBuyLink} onChange={(event) => setSourceBuyLink(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.commentary}: </span>
                </div>
                <div className="upload-container-row">
                    <textarea className="upload-textarea-small" style={{height: "80px"}} value={sourceCommentary} onChange={(event) => setSourceCommentary(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.englishCommentary}: </span>
                </div>
                <div className="upload-container-row">
                    <textarea className="upload-textarea-small" style={{height: "80px"}} value={sourceEnglishCommentary} onChange={(event) => setSourceEnglishCommentary(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.mirrors}: </span>
                </div>
                <div className="upload-container-row">
                    <textarea className="upload-textarea-small" style={{height: "80px"}} value={sourceMirrors} onChange={(event) => setSourceMirrors(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>
            </div>
            <span className="upload-heading">{i18n.tag.artist}</span>
            <span className="upload-text-alt">{i18n.pages.upload.artistExists}</span>
            <div className="upload-container">
                {generateArtistsJSX()}
            </div>
            <span className="upload-heading">{i18n.navbar.characters}</span>
            <span className="upload-text-alt">{i18n.pages.upload.characterExists}</span>
            <div className="upload-container">
                {generateCharactersJSX()}
            </div>
            <span className="upload-heading">{i18n.tag.series}</span>
            <span className="upload-text-alt">{i18n.pages.upload.seriesExists}</span>
            <div className="upload-container">
                {generateSeriesJSX()}
            </div>
            {displayImage && getCurrentFiles().length ?
            <div className="upload-row">
                {functions.isVideo(currentImg) ? 
                <video autoPlay muted loop disablePictureInPicture className="tag-img-preview" src={currentImg}></video>:
                <img className="tag-img-preview" src={getCurrentFiles()[currentIndex]?.thumbnail ? getCurrentFiles()[currentIndex].thumbnail : currentImg}/>}
            </div>
            : null}
            <div className="upload-row" style={{marginBottom: "5px"}}>
                <span className="upload-heading">{i18n.navbar.tags}</span>
                <div className="upload-button-container">
                    <button className="upload-button" onClick={() => setDisplayImage((prev) => !prev)}>
                        {displayImage ?
                            <span className="upload-button-text" style={{paddingLeft: "0px"}}>- {i18n.pages.upload.hideImage}</span> :
                            <span className="upload-button-text" style={{paddingLeft: "0px"}}>+ {i18n.pages.upload.displayImage}</span>
                        }
                    </button>
                </div>
            </div>
            {danbooruError ? <span ref={danbooruErrorRef} className="submit-error-text"></span> : null}
            <span className="upload-link" onClick={tagLookup} style={{marginBottom: "5px"}}>{i18n.pages.upload.fetchFromDanbooru}</span>
            <span className="upload-text-alt">{i18n.pages.upload.enterTags}
            <Link className="upload-link" target="_blank" to="/help#tagging">{i18n.pages.upload.taggingGuide}</Link></span>
            <div className="upload-container">
                <SearchSuggestions active={tagActive} text={functions.cleanHTML(rawTags)} x={tagX} y={tagY} width={200} click={handleRawTagClick} type="tag"/>
                <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                    <ContentEditable innerRef={rawTagRef} className="upload-textarea" spellCheck={false} html={rawTags} onChange={(event) => setRawTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                </div>
            </div>
            <div className="upload-row">
                <span className="upload-text">{i18n.pages.edit.editReason}: </span>
                <input style={{width: "100%"}} className="upload-input-wide2" type="text" value={reason} onChange={(event) => setReason(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
            </div>
            {newTags.length ? <>
            <span className="upload-heading">{i18n.labels.newTags}</span>
            <div className="upload-container">
                {generateTagsJSX()}
            </div>
            </> : null}
            <div className="upload-center-row">
                {submitError ? <span ref={submitErrorRef} className="submit-error-text"></span> : null}
                <div className="upload-submit-button-container">
                    <button className="upload-button" onClick={() => history.push(`/post/${postID}`)}>
                            <span className="upload-button-submit-text">{i18n.buttons.cancel}</span>
                    </button>
                    <button className="upload-button" onClick={() => submit()}>
                            <span className="upload-button-submit-text">{i18n.buttons.edit}</span>
                    </button>
                </div>
            </div>
            </>}
            </div>
            <Footer/>
        </>
        )
    }

    return (
        <>
        <CaptchaDialog forceCaptcha={true}/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {getEditPostJSX()}
            </div>
        </div>
        </>
    )
}

export default EditPostPage