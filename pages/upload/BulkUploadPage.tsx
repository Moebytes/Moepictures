import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
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
import hot from "../../assets/icons/hot.png"
import erotic from "../../assets/icons/erotic.png"
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
import PostAnimation from "../../components/image/PostAnimation"
import PostVideo from "../../components/image/PostVideo"
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
import {Post, PostType, PostRating, PostStyle, UploadTag, UploadImage} from "../../types/Types"
import path from "path"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any
let caretPosition = 0

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
    const {resetImageFilters, resetAudioFilters} = useFilterActions()
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
    const [rawMetaTags, setRawMetaTags] = useState("")
    const [artistActive, setArtistActive] = useState(false)
    const [characterActive, setCharacterActive] = useState(false)
    const [seriesActive, setSeriesActive] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [metaActive, setMetaActive] = useState(false)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState("")
    const [currentAnimatedWebp, setCurrentAnimatedWebp] = useState(false)
    const progressBarRef = useRef<HTMLDivElement>(null!)
    const artistInputRef = useRef<HTMLInputElement>(null!)
    const characterInputRef = useRef<HTMLInputElement>(null!)
    const seriesInputRef = useRef<HTMLInputElement>(null!)
    const metaInputRef = useRef<HTMLInputElement>(null!)
    const appendTagsRef = useRef<HTMLTextAreaElement>(null!)
    const navigate = useNavigate()

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
        resetImageFilters()
        resetAudioFilters()
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
            functions.dom.replaceLocation("/403")
        }
    }, [session])

    useEffect(() => {
        if (uploadDropFiles?.length) {
            validate(uploadDropFiles)
            setUploadDropFiles([])
        }
    }, [uploadDropFiles])

    const validate = async (files: File[], links?: string[]) => {
        let {images, error} = await functions.image.validateImages(files, links, session, i18n)
        if (error) {
            setUploadError(true)
            if (!uploadErrorRef.current) await functions.timeout(20)
            uploadErrorRef.current!.innerText = error
            await functions.timeout(3000)
            setUploadError(false)
        } else {
            setCurrentImg(images[0].link)
            setCurrentIndex(0)
            if (showUpscaled) {
                setUpscaledFiles((prev) => [...prev, ...images])
            } else {
                setOriginalFiles((prev) => [...prev, ...images])
            }
        }
    }

    useEffect(() => {
        fetch(currentImg).then((r) => r.arrayBuffer()).then((buffer) => {
            setCurrentAnimatedWebp(functions.file.isAnimatedWebp(buffer))
        })
    }, [currentImg])

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

    const linkUpload = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const links = functions.util.removeDuplicates(event.target.value.split(/[\n\r\s]+/g).filter((l: string) => l.startsWith("http"))) as string[]
        if (!links?.[0]) return
        clearTimeout(enterLinksTimer)
        enterLinksTimer = setTimeout(async () => {
            let files = [] as File[]
            for (let i = 0; i < links.length; i++) {
                const fileArr = await functions.http.proxyImage(links[i], session, setSessionFlag)
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
                const bytes = await functions.byte.base64toUint8Array(current.thumbnail)
                dupes = await functions.http.post("/api/search/similar", {bytes: Object.values(bytes)}, session, setSessionFlag)
            } else {
                dupes = await functions.http.post("/api/search/similar", {bytes: current.bytes}, session, setSessionFlag)
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
            const sourceData = await functions.http.post("/api/misc/sourcelookup", {current: currentArr[0], rating}, session, setSessionFlag)
            const tagData = await functions.http.post("/api/misc/taglookup", {current: currentArr[0], type, rating: sourceData.rating, style, hasUpscaled}, session, setSessionFlag)

            let dataArtists = sourceData.artists?.[0]?.tag ? sourceData.artists : tagData.artists

            const data = {
                images: currentArr,
                upscaledImages: upscaledCurrentArr,
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
                    bookmarks: functions.util.safeNumber(sourceData.source.bookmarks),
                    buyLink: "",
                    mirrors: sourceData.source.mirrors
                },
                artists: dataArtists,
                characters: tagData.characters,
                series: tagData.series,
                newTags: tagData.newTags,
                tags: [...tagData.tags, ...tagData.meta],
                tagGroups: [],
                duplicates: false,
                noImageUpdate: true
            }

            if (rawArtist?.trim()) {
                const artistArr = functions.util.cleanHTML(rawArtist).trim().split(/[\n\r\s]+/g)
                let newArtists = [] as UploadTag[]
                for (let i = 0; i < artistArr.length; i++) {
                    newArtists.push({tag: artistArr[i]})
                }
                data.artists = newArtists
            }
            if (rawCharacter?.trim()) {
                const characterArr = functions.util.cleanHTML(rawCharacter).trim().split(/[\n\r\s]+/g)
                let newCharacters = [] as UploadTag[]
                for (let i = 0; i < characterArr.length; i++) {
                    newCharacters.push({tag: characterArr[i]})
                }
                if (data.characters.map((s) => s.tag).filter(Boolean).length === 1) {
                    data.characters = newCharacters
                } else {
                    data.characters.push(...newCharacters)
                }
                data.characters = functions.util.removeDuplicates(data.characters)
            }
            if (rawSeries?.trim()) {
                const seriesArr = functions.util.cleanHTML(rawSeries).trim().split(/[\n\r\s]+/g)
                let newSeries = [] as UploadTag[]
                for (let i = 0; i < seriesArr.length; i++) {
                    newSeries.push({tag: seriesArr[i]})
                }
                if (data.series.map((s) => s.tag).filter(Boolean).length === 1) {
                    data.series = newSeries
                } else {
                    data.series.push(...newSeries)
                }
                data.series = functions.util.removeDuplicates(data.series)
            }
            if (rawAppendTags?.trim()) {
                const appendData = functions.util.cleanHTML(rawAppendTags).trim().split(/[\n\r\s]+/g)
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
            if (rawMetaTags?.trim()) {
                const newMeta = functions.util.cleanHTML(rawMetaTags).trim().split(/[\n\r\s]+/g)
                if (data.tags.filter(Boolean).length === 1) {
                    data.tags = newMeta
                } else {
                    data.tags.push(...newMeta)
                }
                data.tags = functions.util.removeDuplicates(data.tags)
            }
            try {
                setProgress(Math.floor((100/submitData.length) * (i+1)))
                setProgressText(`${i+1}/${submitData.length}`)
                await functions.http.post("/api/post/upload", data, session, setSessionFlag)
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
        if (functions.file.isLive2D(currentImg)) {
            return <PostLive2D live2d={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.file.isModel(currentImg)) {
            return <PostModel model={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.file.isAudio(currentImg)) {
            return <PostSong audio={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.file.isVideo(currentImg)) {
            return <PostVideo video={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.file.isGIF(currentImg) || currentAnimatedWebp) {
            return <PostAnimation anim={currentImg} noKeydown={true} noNotes={true}/>
        } else {
            return <PostImage img={currentImg} noKeydown={true} noNotes={true}/>
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
                    <button className={`upload-button ${rating === "hot" ? "button-selected" : ""}`} onClick={() => setRating("hot")}>
                        <img className="upload-button-img" src={hot}/>
                        <span className="upload-button-text">{i18n.sortbar.rating.hot}</span>
                    </button>
                    <button className={`upload-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                        <img className="upload-button-img" src={erotic}/>
                        <span className="upload-button-text">{i18n.sortbar.rating.erotic}</span>
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
                    <button className={`upload-button ${rating === "hot" ? "button-selected" : ""}`} onClick={() => setRating("hot")}>
                        <img className="upload-button-img" src={hot}/>
                        <span className="upload-button-text">{i18n.sortbar.rating.hot}</span>
                    </button>
                    <button className={`upload-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                        <img className="upload-button-img" src={erotic}/>
                        <span className="upload-button-text">{i18n.sortbar.rating.erotic}</span>
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
        setRawArtist((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const handleCharacterClick = (tag: string) => {
        setRawCharacter((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }
    
    const handleSeriesClick = (tag: string) => {
        setRawSeries((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const handleMetaClick = (tag: string) => {
        setRawMetaTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const setCaretPosition = (ref: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null) => {
        caretPosition = functions.render.getCaretPosition(ref)
    }

    const handleTagsClick = (tag: string) => {
        setRawAppendTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    useEffect(() => {
        const tagX = functions.render.getTagX()
        const tagY = functions.render.getTagY()
        setTagX(tagX)
        setTagY(tagY)
    }, [rawArtist, rawCharacter, rawSeries, rawMetaTags, rawAppendTags])

    useEffect(() => {
        if (artistActive || characterActive || seriesActive || metaActive || tagActive) {
            const tagX = functions.render.getTagX()
            const tagY = functions.render.getTagY()
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [artistActive, characterActive, seriesActive, metaActive, tagActive])

    const updateProgressColor = () => {
        const progressBar = progressBarRef.current?.querySelector(".progress-bar") as HTMLElement
        if (progressBar) {
            const color = functions.color.rotateColor("#5a56ff", siteHue, siteSaturation, siteLightness)
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
                <button className="upload-button" onClick={() => navigate(-1)}
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
                <SearchSuggestions active={artistActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={functions.render.getTypingWord(artistInputRef.current)} click={handleArtistClick} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonArtist}: </span>
                    <input ref={artistInputRef} className="upload-input-wide2 artist-tag-color" type="text" value={rawArtist} onChange={(event) => {setCaretPosition(artistInputRef.current); setRawArtist(event.target.value)}} spellCheck={false} onFocus={() => setArtistActive(true)} onBlur={() => setArtistActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={characterActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={functions.render.getTypingWord(characterInputRef.current)} click={handleCharacterClick} type="character"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonCharacter}: </span>
                    <input ref={characterInputRef} className="upload-input-wide2 character-tag-color" type="text" value={rawCharacter} onChange={(event) => {setCaretPosition(characterInputRef.current); setRawCharacter(event.target.value)}} spellCheck={false} onFocus={() => setCharacterActive(true)} onBlur={() => setCharacterActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={seriesActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={functions.render.getTypingWord(seriesInputRef.current)} click={handleSeriesClick} type="series"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonSeries}: </span>
                    <input ref={seriesInputRef} className="upload-input-wide2 series-tag-color" type="text" value={rawSeries} onChange={(event) => {setCaretPosition(seriesInputRef.current); setRawSeries(event.target.value)}} spellCheck={false} onFocus={() => setSeriesActive(true)} onBlur={() => setSeriesActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={metaActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={functions.render.getTypingWord(metaInputRef.current)} click={handleMetaClick} type="meta"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.bulkUpload.commonMeta}: </span>
                    <input ref={metaInputRef} className="upload-input-wide2 meta-tag-color" type="text" value={rawMetaTags} onChange={(event) => {setCaretPosition(metaInputRef.current); setRawMetaTags(event.target.value)}} spellCheck={false} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <div className="upload-container">
                <SearchSuggestions active={tagActive} x={tagX} y={tagY} width={mobile ? 150 : 200} text={functions.render.getTypingWord(appendTagsRef.current)} click={handleTagsClick} type="tags"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text" style={{marginRight: "10px"}}>{i18n.pages.bulkUpload.appendTags}: </span>
                    <ContentEditable style={{minHeight: "70px", width: mobile ? "100%" : "50%"}} innerRef={appendTagsRef} className="upload-textarea" spellCheck={false} html={rawAppendTags} onChange={(event) => {setCaretPosition(appendTagsRef.current); setRawAppendTags(event.target.value)}} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
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