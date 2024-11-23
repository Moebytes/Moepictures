import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
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
import upscaleIcon from "../assets/icons/upscale.png"
import originalIcon from "../assets/icons/original.png"
import image from "../assets/icons/image.png"
import animation from "../assets/icons/animation.png"
import video from "../assets/icons/video.png"
import comic from "../assets/icons/comic.png"
import audio from "../assets/icons/audio.png"
import model from "../assets/icons/model.png"
import live2d from "../assets/icons/live2d.png"
import explicit from "../assets/icons/explicit.png"
import questionable from "../assets/icons/questionable.png"
import safe from "../assets/icons/safe.png"
import $2d from "../assets/icons/2d.png"
import $3d from "../assets/icons/3d.png"
import pixel from "../assets/icons/pixel.png"
import chibi from "../assets/icons/chibi.png"
import daki from "../assets/icons/daki.png"
import Carousel from "../components/Carousel"
import PostImage from "../components/PostImage"
import PostModel from "../components/PostModel"
import PostLive2D from "../components/PostLive2D"
import PostSong from "../components/PostSong"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useCacheSelector, useCacheActions, useFilterActions} from "../store"
import JSZip from "jszip"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import {ProgressBar} from "react-bootstrap"
import permissions from "../structures/Permissions"
import xButton from "../assets/icons/x-button-magenta.png"
import tagConvert from "../assets/json/tag-convert.json"
import "./styles/uploadpage.less"
import path from "path"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any

const BulkUploadPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {showUpscaled} = useSearchSelector()
    const {setShowUpscaled} = useSearchActions()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setPixelate, setBlur, setSharpen} = useFilterActions()
    const {uploadDropFiles} = useCacheSelector()
    const {setUploadDropFiles} = useCacheActions()
    const [displayImage, setDisplayImage] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [saucenaoError, setSaucenaoError] = useState(false)
    const [danbooruError, setDanbooruError] = useState(false)
    const [originalFiles, setOriginalFiles] = useState([]) as any
    const [upscaledFiles, setUpscaledFiles] = useState([]) as any
    const [dupPosts, setDupPosts] = useState([]) as any
    const uploadErrorRef = useRef<any>(null)
    const submitErrorRef = useRef<any>(null)
    const enterLinksRef = useRef<any>(null)
    const [currentImg, setCurrentImg] = useState(null) as any
    const [currentIndex, setCurrentIndex] = useState(0) as any
    const [imgChangeFlag, setImgChangeFlag] = useState(false)
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2d")
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [rawArtist, setRawArtist] = useState("")
    const [rawCharacter, setRawCharacter] = useState("")
    const [rawSeries, setRawSeries] = useState("")
    const [rawAppendTags, setRawAppendTags] = useState("")
    const [artistActive, setArtistActive] = useState(false) as any
    const [characterActive, setCharacterActive] = useState(false) as any
    const [seriesActive, setSeriesActive] = useState(false) as any
    const [tagActive, setTagActive] = useState(false) as any
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState("")
    const progressBarRef = useRef<any>(null)
    const artistInputRef = useRef(null) as any
    const characterInputRef = useRef(null) as any
    const seriesInputRef = useRef(null) as any
    const appendTagsRef = useRef(null) as any
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
        if (!permissions.isAdmin(session)) {
            functions.replaceLocation("/403")
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
        let isLive2DArr = [] as any
        for (let i = 0; i < files.length; i++) {
            const fileReader = new FileReader()
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    let live2d = false
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
                                        glb ? 200 :
                                        fbx ? 200 :
                                        obj ? 200 :
                                        mp4 ? 300 :
                                        webm ? 300 : 300
                        if (MB <= maxSize || permissions.isMod(session)) {
                            if (zip) {
                                live2d = await functions.isLive2DZip(bytes)
                                if (live2d) {
                                    acceptedArray.push({file: files[i], ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : null, bytes})
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
                                            acceptedArray.push({file: new File([data], filename), ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : null, bytes: data})
                                        } else {
                                            error = `Supported types in zip: png, jpg, webp, avif, gif, mp4, webm, mp3, wav, glb, fbx, obj.`
                                        }
                                    }
                                    resolve()
                                }
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
                    isLive2DArr.push(live2d)
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
                let width = ""
                let height = ""
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
                urls.push({link, ext: acceptedArray[i].ext, size: acceptedArray[i].file.size, thumbnail,
                originalLink: acceptedArray[i].originalLink, bytes: acceptedArray[i].bytes, name: acceptedArray[i].file.name})
            }
            setCurrentImg(urls[0].link)
            setCurrentIndex(0)
            if (showUpscaled) {
                setUpscaledFiles((prev: any) => [...prev, ...urls])
            } else {
                setOriginalFiles((prev: any) => [...prev, ...urls])
            }
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
        const arrayBuffer = await functions.get(`/api/misc/proxy?url=${image}`, null, session, setSessionFlag)
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
                const {width, height} = await functions.imageDimensions(firstURL, session)
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
        const currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a: any) => a.link === currentImg.replace(/\?.*$/, ""))
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
        const newLink = currentFiles[newIndex]?.link || null
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentImg(newLink)
        forceUpdate()
    }
    
    const left = () => {
        const currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a: any) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = 0
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const right = () => {
        const currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a: any) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex + 1
        if (newIndex > currentFiles.length - 1) newIndex = currentFiles.length - 1
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const submit = async () => {
        let submitObj = {} as any
        let upscaledSubmitObj = {} as any
        for (let i = 0; i < originalFiles.length; i++) {
            const current = originalFiles[i]
            const upscaledCurrent = upscaledFiles[i]
            current.bytes = Object.values(current.bytes)
            let dupes = [] as any
            if (current.thumbnail) {
                const bytes = await functions.base64toUint8Array(current.thumbnail)
                dupes = await functions.post("/api/search/similar", {bytes: Object.values(bytes), type: current.ext}, session, setSessionFlag)
            } else {
                dupes = await functions.post("/api/search/similar", {bytes: Object.values(current.bytes), type: current.ext}, session, setSessionFlag)
            }
            if (dupes.length) continue
            let id = current.name.includes("_s") ? current.name : current.name.split("_")[0]
            let upscaledID = current.name.includes("_s") ? current.name : current.name.split("_")[0]
            if (submitObj[id]) {
                submitObj[id].push(current)
            } else {
                submitObj[id] = [current]
            }
            if (upscaledSubmitObj[upscaledID]) {
                upscaledSubmitObj[upscaledID].push(upscaledCurrent)
            } else {
                upscaledSubmitObj[upscaledID] = [upscaledCurrent]
            }
        }
        const submitData = Object.values(submitObj) as any[][]
        const upscaledSubmitData = Object.values(upscaledSubmitObj) as any[][]
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
            const currentArr = submitData[i]
            const upscaledCurrentArr = upscaledSubmitData[i]
            const sourceData = await sourceLookup(currentArr[0], restrict)
            const tagData = await tagLookup(currentArr[0], type, style, sourceData.danbooruLink, sourceData.restrict)

            let dataArtists = sourceData.artists?.[0]?.tag ? sourceData.artists : tagData.artists

            let newOriginalFiles = currentArr.map((a: any) => {
                a.bytes = Object.values(a.bytes)
                return a
            })
            let newUpscaledFiles = upscaledCurrentArr.map((a: any) => {
                a.bytes = Object.values(a.bytes)
                return a
            })

            const data = {
                images: newOriginalFiles,
                upscaledImages: newUpscaledFiles,
                type: tagData.type,
                restrict: tagData.restrict,
                style: tagData.style,
                parentID: "",
                source: {
                    title: sourceData.source.title,
                    translatedTitle: sourceData.source.translatedTitle,
                    artist: sourceData.source.artist,
                    posted: sourceData.source.posted,
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
                const artistArr = functions.cleanHTML(rawArtist).trim().split(/[\n\r\s]+/g)
                let newArtists = [] as any
                for (let i = 0; i < artistArr.length; i++) {
                    newArtists.push({tag: artistArr[i]})
                }
                data.artists = newArtists
            }
            if (rawCharacter?.trim()) {
                const characterArr = functions.cleanHTML(rawCharacter).trim().split(/[\n\r\s]+/g)
                let newCharacters = [] as any
                for (let i = 0; i < characterArr.length; i++) {
                    newCharacters.push({tag: characterArr[i]})
                }
                if (data.characters.map((s: any) => s.tag).filter(Boolean).length === 1) {
                    data.characters = newCharacters
                } else {
                    data.characters.push(...newCharacters)
                }
                data.characters = functions.removeDuplicates(data.characters)
            }
            if (rawSeries?.trim()) {
                const seriesArr = functions.cleanHTML(rawSeries).trim().split(/[\n\r\s]+/g)
                let newSeries = [] as any
                for (let i = 0; i < seriesArr.length; i++) {
                    newSeries.push({tag: seriesArr[i]})
                }
                if (data.series.map((s: any) => s.tag).filter(Boolean).length === 1) {
                    data.series = newSeries
                } else {
                    data.series.push(...newSeries)
                }
                data.series = functions.removeDuplicates(data.series)
            }
            if (rawAppendTags?.trim()) {
                const appendData = functions.cleanHTML(rawAppendTags).trim().split(/[\n\r\s]+/g)
                let toAppend = [] as string[]
                let toRemove = [] as string[]
                for (const tag of appendData) {
                    if (tag.startsWith("-")) {
                        toRemove.push(tag.replace("-", ""))
                    } else {
                        toAppend.push(tag.startsWith("+") ? tag.replace("+", "") : tag)
                    }
                }
                const tagSet = new Set(data.tags)
                toAppend.forEach(tag => tagSet.add(tag))
                toRemove.forEach(tag => tagSet.delete(tag))
                data.tags = Array.from(tagSet)
            }
            try {
                setProgress(Math.floor((100/submitData.length) * (i+1)))
                setProgressText(`${i+1}/${submitData.length}`)
                await functions.post("/api/post/upload", data, session, setSessionFlag)
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
        let posted = ""
        let bookmarks = ""
        let danbooruLink = ""
        let mirrors = [] as any
        let artists = [{}] as any

        let basename = path.basename(current.name, path.extname(current.name)).trim()
        if (/^\d+(?=$|_p)/.test(basename)) {
            const pixivID = basename.match(/^\d+(?=$|_p)/gm)?.[0] ?? ""
            link = `https://www.pixiv.net/en/artworks/${pixivID}`
            const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}`)
            if (result.length) {
                danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
                if (result[0].rating === "q") restrict = "questionable"
                if (result[0].rating === "e") restrict = "explicit"
            }
            try {
                const illust = await functions.get(`/api/misc/pixiv?url=${link}`, null, session, setSessionFlag)
                commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                posted = functions.formatDate(new Date(illust.create_date), true)
                link = illust.url 
                title = illust.title
                artist = illust.user.name
                bookmarks = illust.total_bookmarks
                const translated = await functions.post("/api/misc/translate", [title, commentary], session, setSessionFlag)
                translatedTitle = translated[0]
                translatedCommentary = translated[1]
                if (illust.x_restrict !== 0) {
                    if (restrict === "safe") restrict = "questionable"
                }
                artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await functions.post("/api/misc/romajinize", [artist], session, setSessionFlag).then((r) => r[0])
                const imageData = await readImage(illust.user.profile_image_urls.medium)
                artists[artists.length - 1].image = imageData?.image
                artists[artists.length - 1].ext = imageData?.ext
                artists[artists.length - 1].bytes = imageData?.bytes
                artists.push({})
            } catch (e) {
                console.log(e)
            }
            mirrors = await functions.post("/api/misc/boorulinks", {pixivID}, session, setSessionFlag)
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
                    posted,
                    mirrors
                }
            }
        } else {
            let results = await functions.post(`/api/misc/saucenao`, bytes, session, setSessionFlag)
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
                        redirectedLink = await functions.get(`/api/misc/redirect?url=${deviantart[0].data.ext_urls[0]}`, null, session, setSessionFlag)
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
                        const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixiv[0].data.pixiv_id}`)
                        if (result.length) {
                            danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
                            if (result[0].rating === "q") restrict = "questionable"
                            if (result[0].rating === "e") restrict = "explicit"
                        }
                    }
                    artist = pixiv[0].data.author_name
                    title = pixiv[0].data.title
                    try {
                        const illust = await functions.get(`/api/misc/pixiv?url=${link}`, null, session, setSessionFlag)
                        commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                        posted = functions.formatDate(new Date(illust.create_date), true)
                        link = illust.url 
                        title = illust.title
                        artist = illust.user.name
                        bookmarks = illust.total_bookmarks
                        const translated = await functions.post("/api/misc/translate", [title, commentary], session, setSessionFlag)
                        translatedTitle = translated[0]
                        translatedCommentary = translated[1]
                        if (illust.x_restrict !== 0) {
                            if (restrict === "safe") restrict = "questionable"
                        }
                        artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await functions.post("/api/misc/romajinize", [artist], session, setSessionFlag).then((r) => r[0])
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
                        redirectedLink = await functions.get(`/api/misc/redirect?url=${deviantart[0].data.ext_urls[0]}`, null, session, setSessionFlag)
                    } catch {
                        // ignore
                    }
                    link = redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0]
                    artist = deviantart[0].data.member_name 
                    title = deviantart[0].data.title
                    try {
                        const deviation = await functions.get(`/api/misc/deviantart?url=${link}`, null, session, setSessionFlag)
                        title = deviation.title
                        artist = deviation.author.user.username
                        link = deviation.url
                        commentary = deviation.description
                        posted = functions.formatDate(new Date(deviation.date), true)
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
                    posted,
                    mirrors
                }
            }
        }
    }

    const tagLookup = async (current: any, type: string, style: string, danbooruLink: string, restrict: string) => {
        let tagArr = [] as any
        let blockedTags = tagConvert.blockedTags
        let tagReplaceMap = tagConvert.tagReplaceMap
        let artists = [{}] as any
        let characters = [{}] as any
        let series = [{}] as any
        let tags = [] as any
        let newTags = [] as any
        const tagMap = await functions.tagsCache(session, setSessionFlag)

        let bytes = "" as any 
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((a) => Object.values(a))
        } else {
            bytes = Object.values(current.bytes) as any
        }

        if (!danbooruLink) danbooruLink = await functions.post(`/api/misc/revdanbooru`, bytes, session, setSessionFlag)

        if (danbooruLink) {
            const json = await functions.fetch(danbooruLink)
            if (json.rating === "q") restrict = "questionable"
            if (json.rating === "e") restrict = "explicit"
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
            if (tagArr.includes("dakimakura")) style = "daki"
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
            let result = await functions.post(`/api/misc/wdtagger`, bytes, session, setSessionFlag).catch(() => null)

            let tagArr = result.tags
            let characterArr = result.characters

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
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
            tagArr.push("upscaled")

            let seriesArr = [] as string[]

            for (let i = 0; i < characterArr.length; i++) {
                const seriesName = characterArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                seriesArr.push(seriesName)
            }

            seriesArr = functions.removeDuplicates(seriesArr)

            for (let i = 0; i < characterArr.length; i++) {
                characters[characters.length - 1].tag = characterArr[i]
                characters.push({})
            }

            for (let i = 0; i < seriesArr.length; i++) {
                series[series.length - 1].tag = seriesArr[i]
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
        }
        return {
            type,
            restrict,
            style,
            artists,
            characters,
            series,
            tags,
            newTags
        }
    }

    const resetAll = () => {
        reset()
        setOriginalFiles([])
        setUpscaledFiles([])
        setCurrentImg(null)
        setCurrentIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
    }

    const getPostJSX = () => {
        if (functions.isLive2D(currentImg)) {
            return <PostLive2D live2d={currentImg} noKeydown={true} noTranslations={true}/>
        } else if (functions.isModel(currentImg)) {
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
                    <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                        <img className="upload-button-img" src={live2d}/>
                        <span className="upload-button-text">Live2D</span>
                    </button>
                </div>
                <div className="upload-row">
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
                    <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                        <img className="upload-button-img" src={live2d}/>
                        <span className="upload-button-text">Live2D</span>
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
                    {session.showR18 ?
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
                    {session.showR18 ?
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
                    {type !== "live2d" ? <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <img className="upload-button-img" src={$3d}/>
                        <span className="upload-button-text">3D</span>
                    </button> : null}
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <img className="upload-button-img" src={chibi}/>
                        <span className="upload-button-text">Chibi</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <img className="upload-button-img" src={pixel}/>
                        <span className="upload-button-text">Pixel</span>
                    </button>
                    {type !== "comic" ?
                    <button className={`upload-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                        <img className="upload-button-img" src={daki}/>
                        <span className="upload-button-text">Daki</span>
                    </button> : null}
                </div>
            )
        }
    }

    useEffect(() => {
        if (type === "comic") {
            if (style === "daki") setStyle("2d")
        } else if (type === "model") {
            if (style === "2d" || style === "daki") setStyle("3d")
        } else if (type === "live2d") {
            if (style === "3d") setStyle("2d")
        } else if (type === "audio") {
            if (style === "3d" || style === "chibi" || style === "daki") setStyle("2d")
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

    const handleTagsClick = (tag: string) => {
        setRawAppendTags((prev: string) => {
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

    const getTagX = () => {
        if (typeof window === "undefined") return 0
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = functions.rangeRect(range, appendTagsRef)
            return rect.left - 10
        }
        return 0
    }

    const getTagY = () => {
        if (typeof window === "undefined") return 0
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = functions.rangeRect(range, appendTagsRef)
            return rect.bottom + window.scrollY + 10
        }
        return 0
    }

    useEffect(() => {
        const tagX = getTagX()
        const tagY = getTagY()
        setTagX(tagX)
        setTagY(tagY)
    }, [rawAppendTags])

    useEffect(() => {
        if (tagActive) {
            const tagX = getTagX()
            const tagY = getTagY()
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [tagActive])

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

    useEffect(() => {
        if (imgChangeFlag) {
            const currentFiles = getCurrentFiles()
            let index = currentIndex
            let current = currentFiles[index]
            if (!current) {
                current = currentFiles[0]
                index = 0
            }
            setCurrentImg(current?.link || null)
            setCurrentIndex(index)
            setImgChangeFlag(false)
        }
    }, [imgChangeFlag, showUpscaled, currentIndex, originalFiles, upscaledFiles])

    const getCurrentFiles = () => {
        return showUpscaled ? upscaledFiles : originalFiles
    }

    const changeUpscaled = () => {
        setShowUpscaled(!showUpscaled)
        setImgChangeFlag(true)
    }

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
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                            <img className="upload-button-img" src={showUpscaled ? upscaleIcon : originalIcon}/>
                            <span className="upload-button-text">{showUpscaled ? "Upscaled" : "Original"}</span>
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
                    <label htmlFor="file-upload" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">Select Files</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                            <img className="upload-button-img" src={linkIcon}/>
                            <span className="upload-button-text">Enter Links</span>
                    </button>
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                            <img className="upload-button-img" src={showUpscaled ? upscaleIcon : originalIcon}/>
                            <span className="upload-button-text">{showUpscaled ? "Upscaled" : "Original"}</span>
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
                    <Carousel images={getCurrentFiles().map((u: any) => u.link)} set={set} index={currentIndex}/>
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
            <div className="upload-container">
                <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={rawAppendTags} click={handleTagsClick} type="tag"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text" style={{marginRight: "10px"}}>Append Tags: </span>
                    <ContentEditable style={{minHeight: "70px", width: mobile ? "100%" : "50%"}} innerRef={appendTagsRef} className="upload-textarea" spellCheck={false} html={rawAppendTags} onChange={(event) => setRawAppendTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
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