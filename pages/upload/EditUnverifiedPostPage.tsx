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
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useCacheSelector, useCacheActions, useFilterActions} from "../../store"
import JSZip from "jszip"
import ContentEditable from "react-contenteditable"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import permissions from "../../structures/Permissions"
import xButton from "../../assets/icons/x-button-magenta.png"
import imageFunctions from "../../structures/ImageFunctions"
import {PostType, PostRating, PostStyle, UploadTag, UploadImage, UnverifiedPost} from "../../types/Types"
import path from "path"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any
let caretPosition = 0

interface Props {
    match: {params: {id: string}}
}

const EditUnverifiedPostPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {showUpscaled} = useSearchSelector()
    const {setShowUpscaled} = useSearchActions()
    const {resetImageFilters, resetAudioFilters} = useFilterActions()
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
    const [metaTags, setMetaTags] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [artistActive, setArtistActive] = useState([] as boolean[])
    const [artistInputRefs, setArtistInputRefs] = useState(artists.map((a) => React.createRef<HTMLInputElement>()))
    const [characterActive, setCharacterActive] = useState([] as boolean[])
    const [characterInputRefs, setCharacterInputRefs] = useState(characters.map((a) => React.createRef<HTMLInputElement>()))
    const [seriesActive, setSeriesActive] = useState([] as boolean[])
    const [seriesInputRefs, setSeriesInputRefs] = useState(series.map((a) => React.createRef<HTMLInputElement>()))
    const [tagActive, setTagActive] = useState(false)
    const [metaActive, setMetaActive] = useState(false)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const metaTagRef = useRef<HTMLInputElement>(null)
    const rawTagRef = useRef<HTMLTextAreaElement>(null)
    const [edited, setEdited] = useState(false)
    const [originalID, setOriginalID] = useState("")
    const [danbooruLink, setDanbooruLink] = useState("")
    const [post, setPost] = useState(null as UnverifiedPost | null)
    const postID = props.match.params.id
    const history = useHistory()

    const updatePost = async () => {
        const post = await functions.get("/api/post/unverified", {postID}, session, setSessionFlag)
        if (!post) return functions.replaceLocation("/404")
        setPost(post)
    }

    const updateFields = async () => {
        if (!post) return
        setOriginalID(post.originalID)
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
        const parentPost = await functions.get("/api/post/parent/unverified", {postID}, session, setSessionFlag)
        if (parentPost) setParentID(parentPost.parentID)

        let files = [] as File[]
        let links = [] as string[]
        let upscaledFiles = [] as File[]
        let upscaledLinks = [] as string[]
        for (let i = 0; i < post.images.length; i++) {
            let imageLink = functions.getUnverifiedImageLink(post.images[i])
            const response = await fetch(functions.appendURLParams(imageLink, {upscaled: false}), {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            if (response.byteLength) {
                const blob = new Blob([new Uint8Array(response)])
                const file = new File([blob], path.basename(imageLink))
                files.push(file)
                links.push(imageLink)
            }
            let upscaledImageLink = functions.getUnverifiedImageLink(post.images[i], true)
            const upscaledResponse = await fetch(functions.appendURLParams(upscaledImageLink, {upscaled: true}), {headers: {"x-force-upscale": "true"}}).then((r) => r.arrayBuffer())
            if (upscaledResponse.byteLength) {
                const upscaledBlob = new Blob([new Uint8Array(upscaledResponse)])
                const upscaledFile = new File([upscaledBlob], path.basename(upscaledImageLink))
                upscaledFiles.push(upscaledFile)
                upscaledLinks.push(upscaledImageLink)
            }
        }
        await validate(files, links, false)
        validate(upscaledFiles, upscaledLinks, true)

        const parsedTags = await functions.parseTagsUnverified([post])
        const tagCategories = await functions.tagCategories(parsedTags, session, setSessionFlag)

        let artists = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.artists.length; i++) {
            if (!artists[i]) artists[i] = {}
            artists[i].tag = tagCategories.artists[i].tag
            if (tagCategories.artists[i].image) {
                try {
                    const imageLink = functions.removeQueryParams(functions.getTagLink("artist", tagCategories.artists[i].image!, tagCategories.artists[i].imageHash))
                    artists[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer()).catch(() => null)
                    if (!arrayBuffer) throw "bad"
                    artists[i].ext = path.extname(imageLink).replace(".", "")
                    artists[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    const imageLink = functions.getUnverifiedTagLink("artist", tagCategories.artists[i].image!)
                    artists[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                    artists[i].ext = path.extname(imageLink).replace(".", "")
                    artists[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                }
            }
        }
        setArtists(artists)

        let characters = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.characters.length; i++) {
            if (!characters[i]) characters[i] = {}
            characters[i].tag = tagCategories.characters[i].tag
            if (tagCategories.characters[i].image) {
                try {
                    const imageLink = functions.removeQueryParams(functions.getTagLink("character", tagCategories.characters[i].image!, tagCategories.characters[i].imageHash))
                    characters[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer()).catch(() => null)
                    if (!arrayBuffer) throw "bad"
                    characters[i].ext = path.extname(imageLink).replace(".", "")
                    characters[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    const imageLink = functions.getUnverifiedTagLink("character", tagCategories.characters[i].image!)
                    characters[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                    characters[i].ext = path.extname(imageLink).replace(".", "")
                    characters[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                }
            }
        }
        setCharacters(characters)

        let series = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.series.length; i++) {
            if (!series[i]) series[i] = {}
            series[i].tag = tagCategories.series[i].tag
            if (tagCategories.series[i].image) {
                try {
                    const imageLink = functions.removeQueryParams(functions.getTagLink("series", tagCategories.series[i].image!, tagCategories.series[i].imageHash))
                    series[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer()).catch(() => null)
                    if (!arrayBuffer) throw "bad"
                    series[i].ext = path.extname(imageLink).replace(".", "")
                    series[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    const imageLink = functions.getUnverifiedTagLink("series", tagCategories.series[i].image!)
                    series[i].image = imageLink
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                    series[i].ext = path.extname(imageLink).replace(".", "")
                    series[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                }
            }
        }
        setSeries(series)
        setMetaTags(tagCategories.meta.map((m) => m.tag).join(" "))
        setRawTags(functions.parseTagGroupsField(tagCategories.tags.map((t) => t.tag), post.tagGroups))
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
        resetImageFilters()
        resetAudioFilters()
    }, [])

    useEffect(() => {
        updatePost()
    }, [postID, session])

    useEffect(() => {
        if (post) updateFields()
    }, [post])

    useEffect(() => {
        document.title = i18n.pages.edit.unverifiedTitle
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie || !post) return
        if (post.uploader !== session.username && !permissions.isMod(session)) {
            functions.replaceLocation("/403")
        }
    }, [post, session])

    const validate = async (files: File[], links?: string[], forceUpscale?: boolean) => {
        let {images, error} = await imageFunctions.validateImages(files, links, session, i18n)
        if (error) {
            setEditPostError(true)
            if (!editPostErrorRef.current) await functions.timeout(20)
            editPostErrorRef.current!.innerText = error
            await functions.timeout(3000)
            setEditPostError(false)
        } else {
            setCurrentImg(images[0].link)
            setCurrentIndex(0)
            if (forceUpscale !== undefined) {
                if (forceUpscale) {
                    setUpscaledFiles((prev) => [...prev, ...images])
                } else {
                    setOriginalFiles((prev) => [...prev, ...images])
                }
            } else {
                if (showUpscaled) {
                    setUpscaledFiles((prev) => [...prev, ...images])
                } else {
                    setOriginalFiles((prev) => [...prev, ...images])
                }
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
        const data = {
            unverifiedID: postID,
            postID: originalID,
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
            tagGroups
        }
        setSubmitError(true)
        if (!submitErrorRef.current) await functions.timeout(20)
        submitErrorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.put("/api/post/edit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
            functions.clearCache()
            return setSubmitError(false)
        } catch (err: any) {
            let errMsg = i18n.pages.upload.error
            if (String(err.response?.data).includes("Invalid images")) errMsg = i18n.pages.upload.errorOriginal
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
            
            const pixivID = post?.source?.match(/\d+/)?.[0] || path.basename(current.name, path.extname(current.name))
            current.name = `${pixivID}${path.extname(current.name)}`

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
        setUpscaledFiles([])
        setOriginalFiles([])
        setCurrentImg("")
        setCurrentIndex(0)
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

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="upload">
                    <span className="upload-heading">{i18n.pages.edit.title}</span>
                    {submitted ?
                    <div className="upload-container">
                        <div className="upload-container-row">
                            <span className="upload-text-alt">{i18n.pages.edit.submitHeading}</span>
                        </div> 
                        <div className="upload-container-row" style={{marginTop: "10px"}}>
                            <button className="upload-button" onClick={() => {history.push(`/unverified/post/${postID}`); setPostFlag(true)}}>
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
                    <video autoPlay muted loop disablePictureInPicture className="tag-img-preview" src={currentImg}></video>:
                    <img className="tag-img-preview" src={currentImg}/>}
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
                    <div className="upload-submit-button-container">
                        <button className="upload-button" onClick={() => history.push(`/unverified/post/${postID}`)}>
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
            </div>
        </div>
        </>
    )
}

export default EditUnverifiedPostPage