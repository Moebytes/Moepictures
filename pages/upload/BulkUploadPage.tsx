import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
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
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useCacheSelector, useCacheActions, useFilterActions} from "../../store"
import JSZip from "jszip"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import {ProgressBar} from "react-bootstrap"
import permissions from "../../structures/Permissions"
import xButton from "../../assets/icons/x-button-magenta.png"
import tagConvert from "../../assets/json/tag-convert.json"
import {Post, PostType, PostRating, PostStyle, UploadTag, UploadImage, UploadImageFile} from "../../types/Types"
import path from "path"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any

const BulkUploadPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
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
    const [uploadError, setUploadError] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [originalFiles, setOriginalFiles] = useState([] as UploadImage[])
    const [upscaledFiles, setUpscaledFiles] = useState([] as UploadImage[])
    const uploadErrorRef = useRef<HTMLSpanElement>(null)
    const submitErrorRef = useRef<HTMLSpanElement>(null)
    const enterLinksRef = useRef<HTMLTextAreaElement>(null)
    const [currentImg, setCurrentImg] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [imgChangeFlag, setImgChangeFlag] = useState(false)
    const [type, setType] = useState("image" as PostType)
    const [rating, setRating] = useState("cute" as PostRating)
    const [style, setStyle] = useState("2d" as PostStyle)
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [rawArtist, setRawArtist] = useState("")
    const [rawCharacter, setRawCharacter] = useState("")
    const [rawSeries, setRawSeries] = useState("")
    const [rawAppendTags, setRawAppendTags] = useState("")
    const [artistActive, setArtistActive] = useState(false)
    const [characterActive, setCharacterActive] = useState(false)
    const [seriesActive, setSeriesActive] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState("")
    const progressBarRef = useRef<HTMLDivElement>(null)
    const artistInputRef = useRef<HTMLInputElement>(null)
    const characterInputRef = useRef<HTMLInputElement>(null)
    const seriesInputRef = useRef<HTMLInputElement>(null)
    const appendTagsRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

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
    }, [])

    useEffect(() => {
        document.title = i18n.pages.bulkUpload.title
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
                                            error = `Supported types in zip: png, jpg, webp, avif, gif, mp4, webm, mp3, wav, glb, fbx, obj.`
                                        }
                                    }
                                    resolve()
                                }
                            } else {
                                acceptedArray.push({file: files[i], ext: result.typename === "mkv" ? "webm" : result.typename, originalLink: links ? links[i] : "", bytes: Object.values(bytes)})
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
                } else if (functions.isVideo(link)) {
                    thumbnail = await functions.videoThumbnail(link)
                } else if (functions.isModel(link)) {
                    thumbnail = await functions.modelImage(link)
                } else if (functions.isAudio(link)) {
                    thumbnail = await functions.songCover(link)
                }
                urls.push({link, ext: acceptedArray[i].ext, size: acceptedArray[i].file.size, thumbnail, width, height,
                originalLink: acceptedArray[i].originalLink, bytes: acceptedArray[i].bytes, name: acceptedArray[i].file.name})
            }
            setCurrentImg(urls[0].link)
            setCurrentIndex(0)
            if (showUpscaled) {
                setUpscaledFiles((prev) => [...prev, ...urls])
            } else {
                setOriginalFiles((prev) => [...prev, ...urls])
            }
        }
        if (error) {
            setUploadError(true)
            if (!uploadErrorRef.current) await functions.timeout(20)
            uploadErrorRef.current!.innerText = error
            await functions.timeout(3000)
            setUploadError(false)
        }
    }

    const reset = () => {
        setType("image")
        setRating("cute")
        setStyle("2d")
    }

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files?.[0]) return
        await validate(Array.from(files))
        event.target.value = ""
    }

    const readImage = async (image: string) => {
        const arrayBuffer = await functions.proxyImage(image, session, setSessionFlag).then((r) => r[0].arrayBuffer())
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
                const gifData = await functions.extractGIFFrames(bytes.buffer)
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
            blob = new Blob([bytes])
            url = URL.createObjectURL(blob)
            return {
                image: `${url}#.${ext}`,
                ext: result.typename,
                bytes
            }
        }
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
        const currentFiles = getCurrentFiles()
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
        const currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = 0
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const right = () => {
        const currentFiles = getCurrentFiles()
        const currentIndex = currentFiles.findIndex((a) => a.link === currentImg.replace(/\?.*$/, ""))
        let newIndex = currentIndex + 1
        if (newIndex > currentFiles.length - 1) newIndex = currentFiles.length - 1
        currentFiles.splice(newIndex, 0, currentFiles.splice(currentIndex, 1)[0])
        showUpscaled ? setUpscaledFiles(upscaledFiles) : setOriginalFiles(originalFiles)
        setCurrentIndex(newIndex)
        forceUpdate()
    }

    const submit = async () => {
        let submitObj = {} as UploadImage
        let upscaledSubmitObj = {} as UploadImage
        for (let i = 0; i < originalFiles.length; i++) {
            const current = originalFiles[i]
            const upscaledCurrent = upscaledFiles[i]
            let dupes = [] as Post[]
            if (current.thumbnail) {
                const bytes = await functions.base64toUint8Array(current.thumbnail)
                dupes = await functions.post("/api/search/similar", {bytes: Object.values(bytes)}, session, setSessionFlag)
            } else {
                dupes = await functions.post("/api/search/similar", {bytes: current.bytes}, session, setSessionFlag)
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
        const submitData = Object.values(submitObj) as UploadImage[][]
        const upscaledSubmitData = Object.values(upscaledSubmitObj) as UploadImage[][]
        if (!submitData.length) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = "All of the posts already exist."
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

            let hasUpscaled = upscaledFiles.length ? true : false
            const sourceData = await functions.post("/api/misc/sourcelookup", {current: currentArr[0], rating}, session, setSessionFlag)
            const tagData = await functions.post("/api/misc/taglookup", {current: currentArr[0], type, rating: sourceData.rating, style, hasUpscaled}, session, setSessionFlag)

            let dataArtists = sourceData.artists?.[0]?.tag ? sourceData.artists : tagData.artists

            const data = {
                images: originalFiles,
                upscaledImages: upscaledFiles,
                type: tagData.type,
                rating: tagData.rating,
                style: tagData.style,
                parentID: "",
                source: {
                    title: sourceData.source.title,
                    englishTitle: sourceData.source.englishTitle,
                    artist: sourceData.source.artist,
                    posted: sourceData.source.posted,
                    source: sourceData.source.source,
                    commentary: sourceData.source.commentary,
                    englishCommentary: sourceData.source.englishCommentary,
                    bookmarks: functions.safeNumber(sourceData.source.bookmarks),
                    buyLink: "",
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
                let newArtists = [] as UploadTag[]
                for (let i = 0; i < artistArr.length; i++) {
                    newArtists.push({tag: artistArr[i]})
                }
                data.artists = newArtists
            }
            if (rawCharacter?.trim()) {
                const characterArr = functions.cleanHTML(rawCharacter).trim().split(/[\n\r\s]+/g)
                let newCharacters = [] as UploadTag[]
                for (let i = 0; i < characterArr.length; i++) {
                    newCharacters.push({tag: characterArr[i]})
                }
                if (data.characters.map((s) => s.tag).filter(Boolean).length === 1) {
                    data.characters = newCharacters
                } else {
                    data.characters.push(...newCharacters)
                }
                data.characters = functions.removeDuplicates(data.characters)
            }
            if (rawSeries?.trim()) {
                const seriesArr = functions.cleanHTML(rawSeries).trim().split(/[\n\r\s]+/g)
                let newSeries = [] as UploadTag[]
                for (let i = 0; i < seriesArr.length; i++) {
                    newSeries.push({tag: seriesArr[i]})
                }
                if (data.series.map((s) => s.tag).filter(Boolean).length === 1) {
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
                if (!submitErrorRef.current) await functions.timeout(20)
                submitErrorRef.current!.innerText = `Failed to submit ${data.images[0].name}`
                setTimeout(() => {
                    return setSubmitError(false)
                }, 2000)
            }
        }
        setSubmitted(true)
        setProgress(0)
        setProgressText("")
    }

    const resetAll = () => {
        reset()
        setOriginalFiles([])
        setUpscaledFiles([])
        setCurrentImg("")
        setCurrentIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
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

    const getTypeJSX = () => {
        if (mobile) {
            return (
                <>
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
                </div>
                </>
            )
        } else {
            return (
                <>
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
                    <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                        <img className="upload-button-img" src={live2d}/>
                        <span className="upload-button-text">{i18n.sortbar.type.live2d}</span>
                    </button>
                    <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                        <img className="upload-button-img" src={model}/>
                        <span className="upload-button-text">{i18n.sortbar.type.model}</span>
                    </button>
                </div>
                </>
            )
        }
    }

    const getRatingJSX = () => {
        if (mobile) {
            return (
                <>
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
                </div> 
                </>
            )
        } else {
            return (
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
                    </div>
                    <div className="upload-row">
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
        let element = null as HTMLInputElement | null
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
        let element = null as HTMLInputElement | null
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
            setCurrentImg(current?.link || "")
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
                <span className="upload-ban-text">{i18n.pages.upload.banText}</span>
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
                <span className="upload-heading">{i18n.pages.bulkUpload.title}</span>
                {submitted ?
                <div className="upload-container">
                    <div className="upload-container-row">
                        <span className="upload-text-alt">{i18n.pages.bulkUpload.submitHeading}</span> 
                    </div> 
                    <div className="upload-container-row" style={{marginTop: "10px"}}>
                        <button className="upload-button" onClick={resetAll}>
                                <span className="upload-button-text">←{i18n.pages.upload.submitMore}</span>
                        </button>
                    </div>
                </div> : <>
                {uploadError ? <div className="upload-row"><span ref={uploadErrorRef} className="upload-text-alt"></span></div> : null}
                {mobile ? <>
                <div className="upload-row">
                    <label htmlFor="file-upload" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
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
                    <label htmlFor="file-upload" className="upload-button">
                        <img className="upload-button-img" src={uploadIcon}/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
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
                    <Carousel images={getCurrentFiles().map((u) => u.link)} set={set} index={currentIndex}/>
                    {getPostJSX()}
                </div>
                : getPostJSX()}
            </div>
            : null}
            <span className="upload-heading">{i18n.pages.upload.classification}</span>
            {getTypeJSX()}
            {getRatingJSX()}
            {getStyleJSX()}
            <div className="upload-container">
                <SearchSuggestions active={artistActive} x={getX("artist")} y={getY("artist")} width={mobile ? 150 : 200} text={rawArtist} click={handleArtistClick} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonArtist}: </span>
                    <input ref={artistInputRef} className="upload-input-wide2 artist-tag-color" type="text" value={rawArtist} onChange={(event) => setRawArtist(event.target.value)} spellCheck={false} onFocus={() => setArtistActive(true)} onBlur={() => setArtistActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={characterActive} x={getX("character")} y={getY("character")} width={mobile ? 150 : 200} text={rawCharacter} click={handleCharacterClick} type="character"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonCharacter}: </span>
                    <input ref={characterInputRef} className="upload-input-wide2 character-tag-color" type="text" value={rawCharacter} onChange={(event) => setRawCharacter(event.target.value)} spellCheck={false} onFocus={() => setCharacterActive(true)} onBlur={() => setCharacterActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={seriesActive} x={getX("series")} y={getY("series")} width={mobile ? 150 : 200} text={rawSeries} click={handleSeriesClick} type="series"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonSeries}: </span>
                    <input ref={seriesInputRef} className="upload-input-wide2 series-tag-color" type="text" value={rawSeries} onChange={(event) => setRawSeries(event.target.value)} spellCheck={false} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={rawAppendTags} click={handleTagsClick} type="tag"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text" style={{marginRight: "10px"}}>{i18n.pages.bulkUpload.appendTags}: </span>
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
                        <span className="upload-button-submit-text">{i18n.pages.bulkUpload.title}</span>
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