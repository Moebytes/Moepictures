import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import uploadIcon from "../assets/purple/upload.png"
import xIcon from "../assets/purple/x.png"
import rightIcon from "../assets/purple/right.png"
import leftIcon from "../assets/purple/left.png"
import linkIcon from "../assets/purple/link.png"
import image from "../assets/purple/image.png"
import animation from "../assets/purple/animation.png"
import video from "../assets/purple/video.png"
import comic from "../assets/purple/comic.png"
import explicit from "../assets/purple/explicit.png"
import questionable from "../assets/purple/questionable.png"
import safe from "../assets/purple/safe.png"
import $2d from "../assets/purple/2d.png"
import $3d from "../assets/purple/3d.png"
import pixel from "../assets/purple/pixel.png"
import chibi from "../assets/purple/chibi.png"
import Carousel from "../components/Carousel"
import PostImage from "../components/PostImage"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, ThemeContext, EnableDragContext, HideTitlebarContext, 
UploadDropFilesContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext, MobileContext,
BlurContext, SharpenContext, PixelateContext, HeaderTextContext, SessionContext, SidebarTextContext, RedirectContext} from "../Context"
import fileType from "magic-bytes.js"
import localforage from "localforage"
import JSZip from "jszip"
import axios from "axios"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import permissions from "../structures/Permissions"
import "./styles/uploadpage.less"
import path from "path"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any

const UploadPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
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
    const [acceptedURLs, setAcceptedURLs] = useState([]) as any
    const [dupPosts, setDupPosts] = useState([]) as any
    const uploadErrorRef = useRef<any>(null)
    const submitErrorRef = useRef<any>(null)
    const saucenaoErrorRef = useRef<any>(null)
    const enterLinksRef = useRef<any>(null)
    const [currentImg, setCurrentImg] = useState(null) as any
    const [currentIndex, setCurrentIndex] = useState(0) as any
    const [currentDupIndex, setCurrentDupIndex] = useState(0) as any
    const [type, setType] = useState("image")
    const [restrict, setRestrict] = useState("safe")
    const [style, setStyle] = useState("2d")
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [thirdPartyID, setThirdPartyID] = useState("")
    const [sourceTitle, setSourceTitle] = useState("")
    const [sourceTranslatedTitle, setSourceTranslatedTitle] = useState("")
    const [sourceArtist, setSourceArtist] = useState("")
    const [sourceDate, setSourceDate] = useState("")
    const [sourceLink, setSourceLink] = useState("")
    const [sourceCommentary, setSourceCommentary] = useState("")
    const [sourceTranslatedCommentary, setSourceTranslatedCommentary] = useState("")
    const [artists, setArtists] = useState([{}]) as any
    const [characters, setCharacters] = useState([{}]) as any
    const [series, setSeries] = useState([{}]) as any
    const [newTags, setNewTags] = useState([]) as any
    const [rawTags, setRawTags] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [artistActive, setArtistActive] = useState([]) as any
    const [artistInputRefs, setArtistInputRefs] = useState(artists.map((a: any) => React.createRef())) as any
    const [characterActive, setCharacterActive] = useState([]) as any
    const [characterInputRefs, setCharacterInputRefs] = useState(characters.map((a: any) => React.createRef())) as any
    const [seriesActive, setSeriesActive] = useState([]) as any
    const [seriesInputRefs, setSeriesInputRefs] = useState(series.map((a: any) => React.createRef())) as any
    const [tagActive, setTagActive] = useState(false)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const rawTagRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Upload"
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
        if (!session.username) {
            setRedirect("/upload")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const getSimilar = async () => {
        if (acceptedURLs[currentIndex]) {
            const img = acceptedURLs[currentIndex]
            const dupes = await axios.post("/api/search/similar", Object.values(img.bytes)).then((r) => r.data)
            setDupPosts(dupes)
        }
    }

    useEffect(() => {
        getSimilar()
    }, [acceptedURLs, currentIndex])

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
                    const result = fileType(bytes)?.[0]
                    const jpg = result?.mime === "image/jpeg"
                    const png = result?.mime === "image/png"
                    const gif = result?.mime === "image/gif"
                    const webp = result?.mime === "image/webp"
                    const mp4 = result?.mime === "video/mp4"
                    const zip = result?.mime === "application/zip"
                    if (jpg || png || webp || gif || mp4 || zip) {
                        const MB = files[i].size / (1024*1024)
                        const maxSize = jpg ? 5 :
                                        png ? 10 :
                                        webp ? 10 :
                                        gif ? 50 :
                                        mp4 ? 100 : 100
                        if (MB <= maxSize) {
                            if (zip) {
                                const reader = new JSZip()
                                const content = await reader.loadAsync(bytes)
                                for (const filename in content.files) {
                                    const file = content.files[filename]
                                    if (file.dir || filename.startsWith("__MACOSX/")) continue
                                    const data = await file.async("uint8array")
                                    const result = fileType(data)?.[0]
                                    const jpg = result?.mime === "image/jpeg"
                                    const png = result?.mime === "image/png"
                                    let webp = result?.mime === "image/webp"
                                    const gif = result?.mime === "image/gif"
                                    const mp4 = result?.mime === "video/mp4"
                                    if (jpg || png || webp || gif || mp4) {
                                        acceptedArray.push({file: new File([data], filename), ext: result.typename, originalLink: links ? links[i] : null, bytes: data})
                                    } else {
                                        error = `Supported types in zip: png, jpg, webp, gif, mp4.`
                                    }
                                }
                                resolve()
                            } else {
                                acceptedArray.push({file: files[i], ext: result.typename, originalLink: links ? links[i] : null, bytes})
                                resolve()
                            }
                        } else {
                            error = `${result.typename.toUpperCase()} max file size: ${maxSize}MB`
                            resolve()
                        }
                    } else {
                        error = `Supported file types: png, jpg, webp, gif, mp4, zip.`
                        resolve()
                    }
                }
                fileReader.readAsArrayBuffer(files[i])
            })  
        }
        if (acceptedArray.length) {
            let urls = [] as any
            for (let i = 0; i < acceptedArray.length; i++) {
                const url = URL.createObjectURL(acceptedArray[i].file)
                let thumbnail = ""
                if (acceptedArray[i].ext === "mp4") {
                    thumbnail = await functions.videoThumbnail(url)
                }
                urls.push({link: `${url}#.${acceptedArray[i].ext}`, ext: acceptedArray[i].ext, size: acceptedArray[i].file.size, thumbnail,
                originalLink: acceptedArray[i].originalLink, bytes: acceptedArray[i].bytes, name: acceptedArray[i].file.name})
            }
            setCurrentImg(urls[0].link)
            setCurrentIndex(0)
            setAcceptedURLs(urls)
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
        setThirdPartyID("")
        setSourceTitle("")
        setSourceTranslatedTitle("")
        setSourceArtist("")
        setSourceCommentary("")
        setSourceTranslatedCommentary("")
        setSourceDate("")
        setSourceLink("")
        setRawTags("")
        setArtists([{}])
        setCharacters([{}])
        setSeries([{}])
        setType("image")
        setRestrict("safe")
        setStyle("2d")
    }

    const upload = async (event: any) => {
        const files = event.target.files
        if (!files?.[0]) return
        await validate(files)
        event.target.value = ""
        reset()
    }

    const uploadTagImg = async (event: any, type: string, index: number) => {
        const file = event instanceof File ? event : event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                let ext = jpg ? "jpg" : png ? "png" : gif ? "gif" : null
                if (jpg || png || gif) {
                    let url = URL.createObjectURL(file)
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
        if (event.target) event.target.value = ""
        forceUpdate()
    }

    const handleTagClick = async (tag: string, index: number) => {
        const tagDetail = await axios.get("/api/tag", {params: {tag}, withCredentials: true}).then((r) => r.data)
        if (tagDetail.image) {
            const tagLink = functions.getTagLink(tagDetail.type, tagDetail.image)
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
        const jsx = [] as any
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
                    <span className="upload-text">Romanized Artist Tag: </span>
                    <input ref={artistInputRefs[i]} className="upload-input-wide" type="text" value={artists[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">Artist Image: </span>
                    <label htmlFor={`artist-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">Upload</span>
                    </label>
                    <input id={`artist-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "artist", i)}/>
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
                <span className="upload-link" onClick={add}>+ Add artist</span>
                {artists.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- Remove artist</span>
                : null}
            </div>
        )
        return jsx
    }

    const generateCharactersJSX = () => {
        const jsx = [] as any
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
                    <span className="upload-text">Romanized Character Tag: </span>
                    <input ref={characterInputRefs[i]} className="upload-input-wide" type="text" value={characters[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">Character Image: </span>
                    <label htmlFor={`character-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">Upload</span>
                    </label>
                    <input id={`character-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "character", i)}/>
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
                <span className="upload-link" onClick={add}>+ Add character</span>
                {characters.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- Remove character</span>
                : null}
            </div>
        )
        return jsx
    }

    const generateSeriesJSX = () => {
        const jsx = [] as any
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
                    <span className="upload-text">Romanized Series Tag: </span>
                    <input ref={seriesInputRefs[i]} className="upload-input-wide" type="text" value={series[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">Series Image: </span>
                    <label htmlFor={`series-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">Upload</span>
                    </label>
                    <input id={`series-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "series", i)}/>
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
                <span className="upload-link" onClick={add}>+ Add series</span>
                {series.length > 1 ?
                <span className="upload-link" onClick={remove} style={{marginLeft: "20px"}}>- Remove series</span>
                : null}
            </div>
        )
        return jsx
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

    const setDup = (img: string, index: number) => {
        setCurrentDupIndex(index)
        const postID = dupPosts[index].postID
        history.push(`/post/${postID}`)
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
        const MB = acceptedURLs.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (MB > 200) {
            setSubmitError(true)
            await functions.timeout(20)
            submitErrorRef.current.innerText = "Combined file size shouldn't exceed 200MB."
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        let newAcceptedURLs = acceptedURLs.map((a: any) => {
            a.bytes = Object.values(a.bytes)
            return a
        })
        const data = {
            images: newAcceptedURLs,
            type,
            restrict,
            style,
            thirdPartyID,
            source: {
                title: sourceTitle,
                translatedTitle: sourceTranslatedTitle,
                artist: sourceArtist,
                date: sourceDate,
                link: sourceLink,
                commentary: sourceCommentary,
                translatedCommentary: sourceTranslatedCommentary
            },
            artists,
            characters,
            series,
            newTags,
            tags: functions.cleanHTML(rawTags).split(/[\n\r\s]+/g),
            duplicates: dupPosts.length ? true : false
        }
        setSubmitError(true)
        await functions.timeout(20)
        submitErrorRef.current.innerText = "Submitting..."
        try {
            if (permissions.isStaff(session)) {
                await axios.post("/api/post/upload", data, {withCredentials: true}).then((r) => r.data)
            } else {
                await axios.post("/api/post/upload/unverified", data, {withCredentials: true}).then((r) => r.data)
            }
            setSubmitted(true)
            return setSubmitError(false)
        } catch {
            submitErrorRef.current.innerText = "Failed to submit. You might be missing required fields."
            await functions.timeout(3000)
            return setSubmitError(false)
        }
    }

    const sourceLookup = async () => {
        setSaucenaoError(true)
        await functions.timeout(20)
        saucenaoErrorRef.current.innerText = "Fetching..."
        if (saucenaoTimeout) {
            saucenaoErrorRef.current.innerText = "Wait a few seconds."
            await functions.timeout(3000)
            return setSaucenaoError(false)
        }
        let current = acceptedURLs[currentIndex]
        let bytes = "" as any 
        if (functions.isVideo(current.link)) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((a) => Object.values(a))
        } else {
            bytes = Object.values(current.bytes) as any
        }
        saucenaoTimeout = true
        try {
            let results = await axios.post(`/api/misc/saucenao`, bytes, {withCredentials: true}).then((r) => r.data)
            let link = ""
            let artist = ""
            let title = ""
            let translatedTitle = ""
            let commentary = ""
            let translatedCommentary = ""
            let date = ""
            if (results.length) {
                const pixiv = results.filter((r: any) => r.header.index_id === 5)
                const twitter = results.filter((r: any) => r.header.index_id === 41)
                const deviantart = results.filter((r: any) => r.header.index_id === 34)
                const danbooru = results.filter((r: any) => r.header.index_id === 9)
                const gelbooru = results.filter((r: any) => r.header.index_id === 25)
                const konachan = results.filter((r: any) => r.header.index_id === 26)
                const yandere = results.filter((r: any) => r.header.index_id === 12)
                const anime = results.filter((r: any) => r.header.index_id === 21)
                if (pixiv.length) {
                    link = `https://www.pixiv.net/en/artworks/${pixiv[0].data.pixiv_id}`
                    artist = pixiv[0].data.author_name
                    title = pixiv[0].data.title
                    try {
                        const illust = await axios.get(`/api/misc/pixiv?url=${link}`, {withCredentials: true}).then((r: any) => r.data)
                        commentary = `${illust.caption.replace(/<\/?[^>]+(>|$)/g, "")}\n\n${illust.tags.map((t: any) => `#${t.name}`).join(" ")}` 
                        date = functions.formatDate(new Date(illust.create_date))
                        link = illust.url 
                        title = illust.title
                        artist = illust.user.name
                        const translated = await axios.post("/api/misc/translate", [title, commentary], {withCredentials: true}).then((r) => r.data)
                        translatedTitle = translated[0]
                        translatedCommentary = translated[1]
                        if (illust.x_restrict !== 0) {
                            setRestrict("explicit")
                        } else {
                            setRestrict("safe")
                        }
                        const pfp = await functions.proxyImage(illust.user.profile_image_urls.medium)
                        artists[artists.length - 1].tag = await axios.post("/api/misc/romajinize", [artist], {withCredentials: true}).then((r) => r.data[0])
                        await uploadTagImg(pfp, "artist", artists.length - 1)
                        artists.push({})
                        artistInputRefs.push(React.createRef())
                        setArtists(artists)
                        forceUpdate()
                        const translatedTags = await axios.post("/api/misc/translate", illust.tags.map((t: any) => t.name), {withCredentials: true}).then((r) => r.data)
                        setRawTags(translatedTags.map((t: string) => t.toLowerCase()).join(" "))
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
                        date = functions.formatDate(new Date(deviation.date))
                        if (deviation.rating === "adult") {
                            setRestrict("questionable")
                        } else {
                            setRestrict("safe")
                        }
                        const pfp = await functions.proxyImage(deviation.author.user.usericon)
                        artists[artists.length - 1].tag = artist
                        await uploadTagImg(pfp, "artist", artists.length - 1)
                        artists.push({})
                        artistInputRefs.push(React.createRef())
                        setArtists(artists)
                        forceUpdate()
                        setRawTags(deviation.keywords.map((k: string) => k.toLowerCase()).join(" "))
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
            setSourceTitle(title)
            setSourceTranslatedTitle(translatedTitle)
            setSourceArtist(artist)
            setSourceLink(link)
            setSourceCommentary(commentary)
            setSourceTranslatedCommentary(translatedCommentary)
            setSourceDate(date)
            if (!title && !artist && !link) {
                saucenaoErrorRef.current.innerText = "No results found."
                await functions.timeout(3000)
            }
            setSaucenaoError(false)
        } catch (e) {
            console.log(e)
            saucenaoErrorRef.current.innerText = "No results found."
            await functions.timeout(3000)
            setSaucenaoError(false)
        }
        setTimeout(async () => {
            saucenaoTimeout = false
        }, 3000)
    }

    const resetAll = () => {
        reset()
        setAcceptedURLs([])
        setCurrentImg(null)
        setCurrentIndex(0)
        setCurrentDupIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
    }

    useEffect(() => {
        updateTags()
    }, [rawTags])

    const updateTags = async () => {
        const tags = functions.removeDuplicates(functions.cleanHTML(rawTags).trim().split(/[\n\r\s]+/g).map((t) => t.trim().toLowerCase())) as string[]
        clearTimeout(tagsTimer)
        tagsTimer = setTimeout(async () => {
            if (!tags?.[0]) return setNewTags([])
            const savedTags = await localforage.getItem("tags") as any
            let notExists = [] as any
            for (let i = 0; i < tags.length; i++) {
                const exists = savedTags.find((t: any) => t.tag === tags[i])
                if (!exists) notExists.push({tag: tags[i]})
            }
            for (let i = 0; i < notExists.length; i++) {
                const index = newTags.findIndex((t: any) => t.tag === notExists[i].tag)
                if (index !== -1) notExists[i] = newTags[index]
            }
            setNewTags(notExists)
        }, 500)
    }

    const generateTagsJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < newTags.length; i++) {
            const changeTagDesc = (value: string) => {
                newTags[i].desc = value 
                setNewTags(newTags)
                forceUpdate()
            }
            jsx.push(
                <>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">Tag: </span>
                    <span className="upload-text" style={{marginLeft: "10px"}}>{newTags[i].tag}</span>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">Description: </span>
                </div>
                <div className="upload-container-row">
                <textarea className="upload-textarea-small" style={{height: "80px"}} value={newTags[i].desc} onChange={(event) => changeTagDesc(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">Optional Tag Image: </span>
                    <label htmlFor={`tag-upload-${i}`} className="upload-button">
                            <img className="upload-button-img-small" src={uploadIcon}/>
                            <span className="upload-button-text-small">Upload</span>
                    </label>
                    <input id={`tag-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "tag", i)}/>
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
            const rect = functions.rangeRect(range, rawTagRef)
            return rect.left - 10
        }
        return 0
    }

    const getTagY = () => {
        if (typeof window === "undefined") return 0
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = functions.rangeRect(range, rawTagRef)
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

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="upload">
                    <span className="upload-heading">Upload</span>
                    {submitted ?
                    <div className="upload-container">
                        <div className="upload-container-row">
                            {permissions.isStaff(session) ?
                            <span className="upload-text-alt">Post was uploaded.</span> :
                            <span className="upload-text-alt">Your post was submitted and will appear on the site if approved.</span>}
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
                        <PostImage img={currentImg} noKeydown={true}/>
                    </div>
                    :
                    <PostImage img={currentImg} noKeydown={true}/>
                    }
                </div>
                : null}
                <span className="upload-heading">Classification</span>
                <span className="upload-text-alt">If there are multiple images, select the rightmost tag that fits.</span>
                {mobile ? <>
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
                </div> </>
                :
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
                </div>}
                {mobile ? <>
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
                    <button className={`upload-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                        <img className="upload-button-img" src={explicit}/>
                        <span className="upload-button-text">Explicit</span>
                    </button>
                </div> </>
                :
                <div className="upload-row">
                    <button className={`upload-button ${restrict === "safe" ? "button-selected" : ""}`} onClick={() => setRestrict("safe")}>
                        <img className="upload-button-img" src={safe}/>
                        <span className="upload-button-text">Safe</span>
                    </button>
                    <button className={`upload-button ${restrict === "questionable" ? "button-selected" : ""}`} onClick={() => setRestrict("questionable")}>
                        <img className="upload-button-img" src={questionable}/>
                        <span className="upload-button-text">Questionable</span>
                    </button>
                    <button className={`upload-button ${restrict === "explicit" ? "button-selected" : ""}`} onClick={() => setRestrict("explicit")}>
                        <img className="upload-button-img" src={explicit}/>
                        <span className="upload-button-text">Explicit</span>
                    </button>
                </div>}
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
                {dupPosts.length ? <>
                <span className="upload-heading">Possible Duplicates</span>
                <div className="upload-row">
                    <Carousel images={dupPosts.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))} set={setDup} index={currentDupIndex}/>
                </div>
                </> : null}
                <div className="upload-container">
                        <div className="upload-container-row">
                            <span className="upload-text-alt">If this is a third-party edit, enter the original post ID: </span>
                            <input className="upload-input" type="number" value={thirdPartyID} onChange={(event) => setThirdPartyID(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                        </div>
                </div>
                <span className="upload-heading">Source</span>
                <div className="upload-container">
                    {saucenaoError ? <span ref={saucenaoErrorRef} className="submit-error-text"></span> : null}
                    <span className="upload-link" onClick={sourceLookup}>Fetch from Saucenao</span>
                    <div className="upload-container-row">
                        <span className="upload-text">Title: </span>
                        <input className="upload-input-wide2" type="text" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Translated Title: </span>
                        <input className="upload-input-wide2" type="text" value={sourceTranslatedTitle} onChange={(event) => setSourceTranslatedTitle(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Artist: </span>
                        <input className="upload-input-wide" type="text" value={sourceArtist} onChange={(event) => setSourceArtist(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Drawn Date: </span>
                        <input className="upload-input-wide" type="date" value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Link: </span>
                        <input className="upload-input-wide2" type="url" value={sourceLink} onChange={(event) => setSourceLink(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Commentary: </span>
                    </div>
                    <div className="upload-container-row">
                        <textarea className="upload-textarea-small" style={{height: "80px"}} value={sourceCommentary} onChange={(event) => setSourceCommentary(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                    <div className="upload-container-row">
                        <span className="upload-text">Translated Commentary: </span>
                    </div>
                    <div className="upload-container-row">
                        <textarea className="upload-textarea-small" style={{height: "80px"}} value={sourceTranslatedCommentary} onChange={(event) => setSourceTranslatedCommentary(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                </div>
                <span className="upload-heading">Artist</span>
                <span className="upload-text-alt">If the artist tag does not yet exist, please upload an artist image.</span>
                <div className="upload-container">
                    {generateArtistsJSX()}
                </div>
                <span className="upload-heading">Characters</span>
                <span className="upload-text-alt">If the character tag does not yet exist, please upload a character image.</span>
                <div className="upload-container">
                    {generateCharactersJSX()}
                </div>
                <span className="upload-heading">Series</span>
                <span className="upload-text-alt">If the series tag does not yet exist, please upload a series image.</span>
                <div className="upload-container">
                    {generateSeriesJSX()}
                </div>
                {displayImage && acceptedURLs.length ?
                <div className="upload-row">
                    {functions.isVideo(currentImg) ? 
                    <video autoPlay muted loop disablePictureInPicture className="tag-img-preview" src={currentImg}></video>:
                    <img className="tag-img-preview" src={currentImg}/>}
                </div>
                : null}
                <div className="upload-row">
                    <span className="upload-heading">Tags</span>
                    <div className="upload-button-container">
                        <button className="upload-button" onClick={() => setDisplayImage((prev) => !prev)}>
                            {displayImage ?
                                <span className="upload-button-text" style={{paddingLeft: "0px"}}>- Hide Image</span> :
                                <span className="upload-button-text" style={{paddingLeft: "0px"}}>+ Display Image</span>
                            }
                        </button>
                    </div>
                </div>
                <span className="upload-text-alt">Enter dashed tags separated by spaces. Tags can describe any of the images. If the tag doesn't exist, you will be promted to create it.
                If you need help with tags, read the <Link className="upload-link" target="_blank" to="/help#tagging">tagging guide.</Link></span>
                <div className="upload-container">
                    <SearchSuggestions active={tagActive} text={functions.cleanHTML(rawTags)} x={tagX} y={tagY} width={200} click={handleRawTagClick} type="tag"/>
                    <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                        <ContentEditable innerRef={rawTagRef} className="upload-textarea" spellCheck={false} html={rawTags} onChange={(event) => setRawTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                    </div>
                </div>
                {newTags.length ? <>
                <span className="upload-heading">New Tags</span>
                <div className="upload-container">
                    {generateTagsJSX()}
                </div>
                </> : null}
                <div className="upload-center-row">
                    {submitError ? <span ref={submitErrorRef} className="submit-error-text"></span> : null}
                    <button className="upload-button" onClick={() => submit()}>
                            <span className="upload-button-submit-text">Submit</span>
                    </button>
                </div>
                </>}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UploadPage