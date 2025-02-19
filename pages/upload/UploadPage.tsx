import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import uploadIcon from "../../assets/icons/upload.png"
import downloadIcon from "../../assets/icons/download.png"
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
import permissions from "../../structures/Permissions"
import xButton from "../../assets/icons/x-button-magenta.png"
import imageFunctions from "../../structures/ImageFunctions"
import path from "path"
import {Post, PostType, PostRating, PostStyle, UploadTag, UploadImage, UnverifiedPost} from "../../types/Types"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any
let caretPosition = 0

const UploadPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n} = useThemeSelector()
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
    const [displayImage, setDisplayImage] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [saucenaoError, setSaucenaoError] = useState(false)
    const [danbooruError, setDanbooruError] = useState(false)
    const [originalFiles, setOriginalFiles] = useState([] as UploadImage[])
    const [upscaledFiles, setUpscaledFiles] = useState([] as UploadImage[])
    const [dupPosts, setDupPosts] = useState([] as Post[])
    const uploadErrorRef = useRef<HTMLSpanElement>(null)
    const submitErrorRef = useRef<HTMLSpanElement>(null)
    const saucenaoErrorRef = useRef<HTMLSpanElement>(null)
    const danbooruErrorRef = useRef<HTMLSpanElement>(null)
    const enterLinksRef = useRef<HTMLTextAreaElement>(null)
    const [currentImg, setCurrentImg] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [imgChangeFlag, setImgChangeFlag] = useState(false)
    const [currentDupIndex, setCurrentDupIndex] = useState(0)
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
    const [sourceCommentary, setSourceCommentary] = useState("")
    const [sourceEnglishCommentary, setSourceEnglishCommentary] = useState("")
    const [sourceBookmarks, setSourceBookmarks] = useState("")
    const [sourceBuyLink, setSourceBuyLink] = useState("")
    const [sourceMirrors, setSourceMirrors] = useState("")
    const [artists, setArtists] = useState([{}] as UploadTag[])
    const [characters, setCharacters] = useState([{}] as UploadTag[])
    const [series, setSeries] = useState([{}] as UploadTag[])
    const [newTags, setNewTags] = useState([] as UploadTag[])
    const [metaTags, setMetaTags] = useState("")
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
    const [metaActive, setMetaActive] = useState(false)
    const [danbooruLink, setDanbooruLink] = useState("")
    const [hideGuidelines, setHideGuidelines] = useState(false)
    const [pending, setPending] = useState([] as UnverifiedPost[])
    const metaTagRef = useRef<HTMLInputElement>(null)
    const rawTagRef = useRef<HTMLTextAreaElement>(null)
    const history = useHistory()

    const parseLinkParam = async () => {
        const linkParam = new URLSearchParams(window.location.search).get("link")
        if (linkParam) {
            const url = window.location.href.match(/(?<=\?link=)(.*)/)?.[0] || ""
            const files = await functions.proxyImage(url, session, setSessionFlag)
            await validate(files, new Array(files.length).fill(url))
            reset()
        }
    }

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

        parseLinkParam()
        const savedHideGuidelines = localStorage.getItem("hideGuidelines")
        if (savedHideGuidelines) setHideGuidelines(savedHideGuidelines === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("hideGuidelines", String(hideGuidelines))
    }, [hideGuidelines])

    useEffect(() => {
        document.title = i18n.buttons.upload
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const updatePending = async () => {
        const pending = await functions.get("/api/post/pending", null, session, setSessionFlag)
        setPending(pending)
   }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/upload")
            history.push("/login")
            setSidebarText("Login required.")
        }
        updatePending()
    }, [session])

    const getSimilar = async () => {
        let currentFiles = getCurrentFiles()
        if (currentFiles[currentIndex]) {
            const img = currentFiles[currentIndex]
            let dupes = [] as Post[]
            if (img.thumbnail) {
                const bytes = await functions.base64toUint8Array(img.thumbnail).then((r) => Object.values(r))
                dupes = await functions.post("/api/search/similar", {bytes}, session, setSessionFlag)
            } else {
                dupes = await functions.post("/api/search/similar", {bytes: Object.values(img.bytes)}, session, setSessionFlag)
            }
            setDupPosts(dupes)
        }
    }

    useEffect(() => {
        getSimilar()
    }, [originalFiles, upscaledFiles, showUpscaled, currentIndex])

    useEffect(() => {
        if (uploadDropFiles?.length) {
            validate(uploadDropFiles)
            setUploadDropFiles([])
        }
    }, [uploadDropFiles])

    const validate = async (files: File[], links?: string[]) => {
        let {images, error} = await imageFunctions.validateImages(files, links, session, i18n)
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
        const item = await imageFunctions.validateTagImage(file)
        if (item) {
            if (type === "artist") {
                artists[index].image = item.image
                artists[index].ext = item.ext
                artists[index].bytes = item.bytes
                setArtists(artists)
            } else if (type === "character") {
                characters[index].image = item.image
                characters[index].ext = item.ext
                characters[index].bytes = item.bytes
                setCharacters(characters)
            } else if (type === "series") {
                series[index].image = item.image
                series[index].ext = item.ext
                series[index].bytes = item.bytes
                setSeries(series)
            } else if (type === "tag") {
                newTags[index].image = item.image
                newTags[index].ext = item.ext
                newTags[index].bytes = item.bytes
                setNewTags(newTags)
            }
        }
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
                <SearchSuggestions active={artistActive[i]} x={getX()} y={getY()} width={mobile ? 150 : 200} text={functions.getTypingWord(artistInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.artistTag}: </span>
                    <input ref={artistInputRefs[i]} className="upload-input-wide artist-tag-color" type="text" value={artists[i].tag} 
                    onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
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
                <SearchSuggestions active={characterActive[i]} x={getX()} y={getY()} width={mobile ? 110 : 200} text={functions.getTypingWord(characterInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="character"/>
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
            if (characters.length > 1) characters.pop()
            if (characterInputRefs.length > 1) characterInputRefs.pop()
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
                <SearchSuggestions active={seriesActive[i]} x={getX()} y={getY()} width={mobile ? 140 : 200} text={functions.getTypingWord(seriesInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="series"/>
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

    const setDup = (img: string, index: number, newTab: boolean) => {
        setCurrentDupIndex(index)
        const dupPost = dupPosts[index]
        if (newTab) {
            window.open(`/post/${dupPost.postID}/${dupPost.slug}`, "_blank")
        } else {
            history.push(`/post/${dupPost.postID}/${dupPost.slug}`)
        }
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
        if (!(showUpscaled ? upscaledFiles : originalFiles).length) setDupPosts([])
        forceUpdate()
    }
    
    const left = () => {
        const currentFiles = showUpscaled ? upscaledFiles : originalFiles
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
        let {tags, tagGroups} = functions.parseTagGroups(functions.cleanHTML(rawTags))
        if (metaTags) tags.push(...metaTags.split(/[\n\r\s]+/g).filter(Boolean))
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
        if (tags.length < 5 && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.upload.tagMinimum
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
        const data = {
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
            tagGroups,
            duplicates: dupPosts.length ? true : false
        }
        setSubmitError(true)
        if (!submitErrorRef.current) await functions.timeout(20)
        submitErrorRef.current!.innerText = i18n.buttons.submitting
        try {
            if (permissions.isCurator(session)) {
                await functions.post("/api/post/upload", data, session, setSessionFlag)
            } else {
                await functions.post("/api/post/upload/unverified", data, session, setSessionFlag)
            }
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
    }

    const sourceLookup = async () => {
        setSaucenaoError(true)
        if (!saucenaoErrorRef.current) await functions.timeout(20)
        saucenaoErrorRef.current!.innerText = i18n.buttons.fetching
        if (saucenaoTimeout) {
            saucenaoErrorRef.current!.innerText = i18n.pages.upload.wait
            await functions.timeout(3000)
            return setSaucenaoError(false)
        }
        try {
            saucenaoTimeout = true
            const currentFiles = getCurrentFiles()
            let current = currentFiles[currentIndex]
    
            const sourceLookup = await functions.post("/api/misc/sourcelookup", {current, rating}, session, setSessionFlag)
            if (sourceLookup.danbooruLink) setDanbooruLink(sourceLookup.danbooruLink)
            if (sourceLookup.artists[0]?.tag) {
                artists[artists.length - 1].tag = sourceLookup.artists[0].tag
                if (sourceLookup.artistIcon) {
                    const pfp = await functions.proxyImage(sourceLookup.artistIcon, session, setSessionFlag).then((r) => r[0])
                    await uploadTagImg(pfp, "artist", artists.length - 1)
                }
                artists.push({})
                artistInputRefs.push(React.createRef())
            }
            setSourceTitle(sourceLookup.source.title)
            setSourceEnglishTitle(sourceLookup.source.englishTitle)
            setSourceArtist(sourceLookup.source.artist)
            setSourceLink(sourceLookup.source.source)
            setSourceCommentary(sourceLookup.source.commentary)
            setSourceEnglishCommentary(sourceLookup.source.englishCommentary)
            setSourceBookmarks(sourceLookup.source.bookmarks)
            setSourceDate(sourceLookup.source.posted)
            setSourceMirrors(sourceLookup.source.mirrors)
            if (!sourceLookup.source.title && !sourceLookup.source.artist && !sourceLookup.source.source) {
                saucenaoErrorRef.current!.innerText = i18n.pages.upload.noResults
                await functions.timeout(3000)
            }
            if (artists.length > 1) artists.pop()
            setArtists(artists)
            forceUpdate()
            setSaucenaoError(false)
        } catch (e) {
            console.log(e)
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
        if (!danbooruErrorRef.current) await functions.timeout(20)
        danbooruErrorRef.current!.innerText = i18n.buttons.fetching
        try {
            const currentFiles = getCurrentFiles()
            let current = currentFiles[currentIndex]
            let hasUpscaled = upscaledFiles.length ? true : false
            const tagLookup = await functions.post("/api/misc/taglookup", {current, type, rating, style, hasUpscaled}, session, setSessionFlag)

            if (tagLookup.danbooruLink) setDanbooruLink(tagLookup.danbooruLink)
            let characters = [{}] as UploadTag[]
            let characterInputRefs = [] as React.RefObject<HTMLInputElement>[]
            for (let i = 0; i < tagLookup.characters.length; i++) {
                if (!tagLookup.characters[i]?.tag) continue
                characters[characters.length - 1].tag = tagLookup.characters[i].tag
                characters[characters.length - 1].image = ""
                const tagDetail = await functions.get("/api/tag", {tag: tagLookup.characters[i].tag!}, session, setSessionFlag).catch(() => null)
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
            }
            if (characters.length > 1) characters.pop()
            if (characterInputRefs.length > 1) characterInputRefs.pop()
            setCharacters(characters)
            setCharacterInputRefs(characterInputRefs)
            forceUpdate()

            let series = [{}] as UploadTag[]
            let seriesInputRefs = [] as React.RefObject<HTMLInputElement>[]
            for (let i = 0; i < tagLookup.series.length; i++) {
                if (!tagLookup.series[i]?.tag) continue
                series[series.length - 1].tag = tagLookup.series[i].tag
                series[series.length - 1].image = ""
                const tagDetail = await functions.get("/api/tag", {tag: tagLookup.series[i].tag!}, session, setSessionFlag).catch(() => null)
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
            }
            series.pop()
            seriesInputRefs.pop()
            setSeries(series)
            setSeriesInputRefs(seriesInputRefs)
            forceUpdate()

            setMetaTags(tagLookup.meta.join(" "))
            setRawTags(tagLookup.tags.join(" "))
            setDanbooruError(false)
        } catch (e) {
            console.log(e)
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
        setCurrentDupIndex(0)
        setShowLinksInput(false)
        setSubmitted(false)
    }

    useEffect(() => {
        updateTags()
    }, [rawTags, session])

    const updateTags = async () => {
        const {tags} = functions.parseTagGroups(functions.cleanHTML(rawTags))
        clearTimeout(tagsTimer)
        tagsTimer = setTimeout(async () => {
            if (!tags?.[0]) return setNewTags([])
            const tagMap = await functions.tagsCache(session, setSessionFlag)
            let notExists = [] as UploadTag[]
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], description: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
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
                newTags[i].description = value 
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
                <textarea className="upload-textarea-small" style={{height: "80px"}} value={newTags[i].description} onChange={(event) => changeTagDesc(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
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

    useEffect(() => {
        const tagX = functions.getTagX()
        const tagY = functions.getTagY()
        setTagX(tagX)
        setTagY(tagY)
    }, [metaTags, rawTags])

    useEffect(() => {
        if (metaActive || tagActive) {
            const tagX = functions.getTagX()
            const tagY = functions.getTagY()
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [metaActive, tagActive])

    const setCaretPosition = (ref: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null) => {
        caretPosition = functions.getCaretPosition(ref)
    }

    const handleRawTagClick = (tag: string) => {
        setRawTags((prev: string) => functions.insertAtCaret(prev, caretPosition, tag))
    }

    const handleMetaTagClick = (tag: string) => {
        setMetaTags((prev: string) => functions.insertAtCaret(prev, caretPosition, tag))
    }

    const getPostJSX = () => {
        if (functions.isLive2D(currentImg)) {
            return <PostLive2D live2d={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.isModel(currentImg)) {
            return <PostModel model={currentImg} noKeydown={true} noNotes={true}/>
        } else if (functions.isAudio(currentImg)) {
            return <PostSong audio={currentImg} noKeydown={true} noNotes={true}/>
        } else {
            return <PostImage img={currentImg} noKeydown={true} noNotes={true}/>
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

        if (functions.currentUploads(pending) >= permissions.getUploadLimit(session)) {
            return (
                <>
                <span className="upload-text" style={{marginTop: "10px", 
                marginLeft: "10px", fontSize: "20px"}}>{i18n.pages.upload.limitReached}</span>
                <button className="upload-button" onClick={() => history.goBack()}
                style={{width: "max-content", marginTop: "10px", marginLeft: "10px"}}>
                        <span className="upload-button-submit-text">←{i18n.buttons.back}</span>
                </button>
                </>
            )
        }

        return (
            <>
            <div className="upload">
                <div className="upload-container-row" style={{alignItems: "center"}}>
                    <span className="upload-heading">{i18n.buttons.upload}</span>
                    <img className="upload-heading-icon" src={hideGuidelines ? downloadIcon : uploadIcon} onClick={() => setHideGuidelines((prev) => !prev)}/>
                </div>
                {submitted ?
                <div className="upload-container">
                    <div className="upload-container-row">
                        {permissions.isMod(session) ?
                        <span className="upload-text-alt">{i18n.pages.upload.submitHeading}</span> :
                        <span className="upload-text-alt">{i18n.pages.upload.submitHeadingApproval}</span>}
                    </div> 
                    <div className="upload-container-row" style={{marginTop: "10px"}}>
                        <button className="upload-button" onClick={resetAll}>
                                <span className="upload-button-text">←{i18n.pages.upload.submitMore}</span>
                        </button>
                    </div>
                </div> : <>
                {!hideGuidelines ? <div className="upload-guidelines">
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line1}<span className="upload-guideline-link" onClick={() => history.push(`/help#uploading`)}>{i18n.pages.upload.guidelines.uploadingGuidelines}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line2}<span className="upload-guideline-link" onClick={() => history.push(`/help#compressing`)}>{i18n.pages.upload.guidelines.compressingGuide}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line3}<span className="upload-guideline-link" onClick={() => history.push(`/help#upscaling`)}>{i18n.pages.upload.guidelines.upscalingGuide}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line4}<span className="upload-guideline-link" onClick={() => history.push(`/help#variations`)}>{i18n.pages.upload.guidelines.variation}</span>{i18n.pages.upload.guidelines.or}<span className="upload-guideline-link" onClick={() => history.push(`/help#child-posts`)}>{i18n.pages.upload.guidelines.childPost}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line5}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.size2000}</span>{i18n.pages.upload.guidelines.forOriginal}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.size8000}</span>{i18n.pages.upload.guidelines.forUpscaled}</span>
                    {type === "image" || type === "comic" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.image.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.image.header1}</span></span>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.image.title2}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.image.header2}</span></span>
                    </> : null}
                    {type === "animation" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.animation.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.animation.header1}</span></span>
                    </> : null}
                    {type === "video" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.video.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.video.header1}</span></span>
                    </> : null}
                    {type === "audio" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.audio.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.audio.header1}</span></span>
                    </> : null}
                    {type === "live2d" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.live2d.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.live2d.header1}</span></span>
                    </> : null}
                    {type === "model" ? <>
                        <span className="upload-guideline">{i18n.pages.upload.guidelines.formats.model.title1}<span className="upload-guideline-alt">{i18n.pages.upload.guidelines.formats.model.header1}</span></span>
                    </> : null}
                </div> : null}
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
                <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <img className="upload-button-img" src={live2d}/>
                    <span className="upload-button-text">{i18n.sortbar.type.live2d}</span>
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
            {dupPosts.length ? <>
            <span className="upload-heading">{i18n.pages.upload.possibleDuplicates}</span>
            <div className="upload-row">
                <Carousel images={dupPosts.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session))} set={setDup} index={currentDupIndex}/>
            </div>
            </> : null}
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
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.buyLink}: </span>
                    <input className="upload-input-wide2" type="url" value={sourceBuyLink} onChange={(event) => setSourceBuyLink(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
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
            <div className="upload-row" style={{marginBottom: "0px"}}>
                <span className="upload-heading">{i18n.tag.meta}</span>
            </div>
            <div className="upload-container" style={{marginBottom: "5px"}}>
                <SearchSuggestions active={metaActive} text={functions.getTypingWord(metaTagRef.current)} x={tagX} y={tagY} width={200} click={handleMetaTagClick} type="meta"/>
                <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                    <input style={{width: "40%"}} ref={metaTagRef} className="upload-input meta-tag-color" spellCheck={false} value={metaTags} onChange={(event) => {setCaretPosition(metaTagRef.current); setMetaTags(event.target.value)}} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
                </div>
            </div>
            {displayImage && getCurrentFiles().length ?
            <div className="upload-row">
                {functions.isVideo(currentImg) ? 
                <video autoPlay muted loop disablePictureInPicture className="tag-img-preview" src={currentImg}></video> :
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
            <Link className="upload-bold-link" target="_blank" to="/help#tagging">{i18n.pages.upload.taggingGuide}</Link>
            {i18n.pages.upload.organizeTags}
            <Link className="upload-bold-link" target="_blank" to="/help#tag-groups">{i18n.pages.upload.tagGroups}</Link></span>
            <div className="upload-container">
                <SearchSuggestions active={tagActive} text={functions.getTypingWord(rawTagRef.current)} x={tagX} y={tagY} width={200} click={handleRawTagClick} type="tags"/>
                <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                    <ContentEditable innerRef={rawTagRef} className="upload-textarea" spellCheck={false} html={rawTags} onChange={(event) => {setCaretPosition(rawTagRef.current); setRawTags(event.target.value)}} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                </div>
            </div>
            {newTags.length ? <>
            <span className="upload-heading">{i18n.labels.newTags}</span>
            <div className="upload-container">
                {generateTagsJSX()}
            </div>
            </> : null}
            <div className="upload-center-row">
                {submitError ? <span ref={submitErrorRef} className="submit-error-text"></span> : null}
                <button className="upload-button" onClick={() => submit()}>
                        <span className="upload-button-submit-text">{i18n.buttons.submit}</span>
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

export default UploadPage