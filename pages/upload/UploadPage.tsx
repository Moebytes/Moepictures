/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate, useParams} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"

import UploadIcon from "../../assets/svg/upload-arrow.svg"
import DownloadIcon from "../../assets/svg/download-arrow.svg"
import XIcon from "../../assets/svg/x-button.svg"
import RightIcon from "../../assets/svg/right-thick.svg"
import LeftIcon from "../../assets/svg/left-thick.svg"
import LinkIcon from "../../assets/svg/link.svg"
import UpscaleIcon from "../../assets/svg/upscale.svg"
import OriginalIcon from "../../assets/svg/original.svg"

import ImageIcon from "../../assets/svg/image.svg"
import AnimationIcon from "../../assets/svg/animation.svg"
import VideoIcon from "../../assets/svg/video.svg"
import ComicIcon from "../../assets/svg/comic.svg"
import Live2dIcon from "../../assets/svg/live2d.svg"
import ModelIcon from "../../assets/svg/model.svg"
import AudioIcon from "../../assets/svg/music.svg"

import CuteIcon from "../../assets/svg/cute.svg"
import SexyIcon from "../../assets/svg/sexy.svg"
import EroticIcon from "../../assets/svg/erotic.svg"
import LewdIcon from "../../assets/svg/lewd.svg"

import $2dIcon from "../../assets/svg/2d.svg"
import $3dIcon from "../../assets/svg/3d.svg"
import PixelIcon from "../../assets/svg/pixel.svg"
import ChibiIcon from "../../assets/svg/chibi.svg"
import DakiIcon from "../../assets/svg/daki.svg"
import SketchIcon from "../../assets/svg/sketch.svg"
import LineartIcon from "../../assets/svg/lineart.svg"
import PromoIcon from "../../assets/svg/promo.svg"

import Carousel from "../../components/site/Carousel"
import PostImage from "../../components/image/PostImage"
import PostAnimation from "../../components/image/PostAnimation"
import PostVideo from "../../components/image/PostVideo"
import PostModel from "../../components/image/PostModel"
import PostLive2D from "../../components/image/PostLive2D"
import PostSong from "../../components/image/PostSong"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagSelector, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useCacheSelector, useCacheActions, useFilterActions} from "../../store"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import permissions from "../../structures/Permissions"
import path from "path"
import {Post, PostFull, PostType, PostRating, PostStyle, UploadTag, UploadImage, UnverifiedPost, SourceFile, UploadableParams, ChildPost} from "../../types/Types"
import "./styles/uploadpage.less"

let enterLinksTimer = null as any
let saucenaoTimeout = false
let tagsTimer = null as any
let caretPosition = 0

interface Props {
    edit?: boolean
    unverified?: boolean
}

const UploadPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {sourceHook} = useFlagSelector()
    const {setRedirect, setPostFlag, setSourceHook} = useFlagActions()
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
    const [sourceError, setSourceError] = useState(false)
    const [tagError, setTagError] = useState(false)
    const [originalFiles, setOriginalFiles] = useState([] as UploadImage[])
    const [upscaledFiles, setUpscaledFiles] = useState([] as UploadImage[])
    const [dupPosts, setDupPosts] = useState([] as Post[])
    const uploadErrorRef = useRef<HTMLSpanElement>(null!)
    const submitErrorRef = useRef<HTMLSpanElement>(null!)
    const sourceErrorRef = useRef<HTMLSpanElement>(null!)
    const tagErrorRef = useRef<HTMLSpanElement>(null!)
    const enterLinksRef = useRef<HTMLTextAreaElement>(null!)
    const [currentImg, setCurrentImg] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [imgChangeFlag, setImgChangeFlag] = useState(false)
    const [currentDupIndex, setCurrentDupIndex] = useState(0)
    const [type, setType] = useState("image" as PostType)
    const [rating, setRating] = useState("cute" as PostRating)
    const [style, setStyle] = useState("2d" as PostStyle)
    const [showLinksInput, setShowLinksInput] = useState(false)
    const [parentID, setParentID] = useState("")
    const [groupName, setGroupName] = useState("")
    const [sourceTitle, setSourceTitle] = useState("")
    const [sourceEnglishTitle, setSourceEnglishTitle] = useState("")
    const [sourceArtist, setSourceArtist] = useState("")
    const [sourceDate, setSourceDate] = useState("")
    const [sourceLink, setSourceLink] = useState("")
    const [sourceCommentary, setSourceCommentary] = useState("")
    const [sourceEnglishCommentary, setSourceEnglishCommentary] = useState("")
    const [sourceBookmarks, setSourceBookmarks] = useState("")
    const [sourceBuyLink, setSourceBuyLink] = useState("")
    const [sourcePixivTags, setSourcePixivTags] = useState("")
    const [sourceMirrors, setSourceMirrors] = useState("")
    const [sourceDrawingTools, setSourceDrawingTools] = useState("")
    const [sourceUserProfile, setSourceUserProfile] = useState("")
    const [sourceImageCount, setSourceImageCount] = useState("")
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
    const [originalID, setOriginalID] = useState("")
    const [post, setPost] = useState(null as PostFull | UnverifiedPost | null)
    const [needsPermission, setNeedsPermission] = useState(false)
    const [postLocked, setPostLocked] = useState(false)
    const [edited, setEdited] = useState(false)
    const [reason, setReason] = useState("")
    const [hideGuidelines, setHideGuidelines] = useState(false)
    const [pending, setPending] = useState([] as UnverifiedPost[])
    const [currentLive2D, setCurrentLive2D] = useState(false)
    const [currentAnimatedWebp, setCurrentAnimatedWebp] = useState(false)
    const [currentAnimatedPng, setCurrentAnimatedPng] = useState(false)
    const [currentPixivUgoira, setCurrentPixivUgoira] = useState(false)
    const [sourceLinks, setSourceLinks] = useState([] as {hash: string, link: string}[])
    const metaTagRef = useRef<HTMLInputElement>(null!)
    const rawTagRef = useRef<HTMLTextAreaElement>(null!)
    const navigate = useNavigate()
    const {id: postID, slug} = useParams() as {id: string, slug: string}

    useEffect(() => {
        if (!session.cookie) return
        if (postID) functions.post.processRedirects(post, postID, slug, navigate, session, setSessionFlag)
    }, [post, session])

    const updatePost = async () => {
        let post = undefined as PostFull | UnverifiedPost | undefined
        try {
            if (props.unverified) {
                post = await functions.http.get("/api/post/unverified", {postID}, session, setSessionFlag)
            } else {
                post = await functions.http.get("/api/post", {postID}, session, setSessionFlag) as PostFull
            }
        } catch (e: any) {
            if (String(e).includes("401")) return
        }
        if (!post) return functions.dom.replaceLocation("/404")
        setPost(post)
    }

    const updateFields = async () => {
        if (!post) return
        setPostLocked(post.locked ?? false)
        if ("originalID" in post) setOriginalID(post.originalID)
        setType(post.type)
        setRating(post.rating)
        setStyle(post.style)
        setSourceTitle(post.title || "")
        setSourceEnglishTitle(post.englishTitle || "")
        setSourceArtist(post.artist || "")
        setSourceCommentary(post.commentary || "")
        setSourceEnglishCommentary(post.englishCommentary || "")
        setSourceMirrors(post.mirrors ? Object.values(post.mirrors).join("\n") : "")
        if (post.posted) setSourceDate(functions.date.formatDate(new Date(post.posted), true))
        setSourceLink(post.source || "")
        setSourceBookmarks(String(post.bookmarks) || "")
        setSourceBuyLink(post.buyLink || "")
        setSourcePixivTags(post.pixivTags?.join(", ") || "")
        setSourceDrawingTools(post.drawingTools?.join(", ") || "")
        setSourceImageCount(String(post.sourceImageCount) || "")
        setSourceUserProfile(post.userProfile || "")
        let parentPost = undefined as ChildPost | undefined 
        if (props.unverified) {
            parentPost = await functions.http.get("/api/post/parent/unverified", {postID}, session, setSessionFlag)
        } else {
            parentPost = await functions.http.get("/api/post/parent", {postID}, session, setSessionFlag)
        }
        if (parentPost) setParentID(parentPost.parentID)

        let files = [] as File[]
        let links = [] as string[]
        let upscaledFiles = [] as File[]
        let upscaledLinks = [] as string[]
        for (let i = 0; i < post.images.length; i++) {
            let imageLink = props.unverified ? functions.link.getUnverifiedImageLink(post.images[i]) 
                : functions.link.getImageLink(post.images[i])
            let response = await functions.http.getBuffer(functions.util.appendURLParams(imageLink, {upscaled: false}), {"x-force-upscale": "false"})
            if (response.byteLength) {
                const decrypted = await functions.crypto.decryptBuffer(response, imageLink, session)
                const blob = new Blob([new Uint8Array(decrypted)])
                const file: SourceFile = new File([blob], path.basename(imageLink))
                file.altSource = post.images[i].altSource
                file.directLink = post.images[i].directLink
                files.push(file)
                links.push(imageLink)
            }
            let upscaledImageLink = props.unverified ? functions.link.getUnverifiedImageLink(post.images[i], true) 
                : functions.link.getImageLink(post.images[i], true)
            let upscaledResponse = await functions.http.getBuffer(functions.util.appendURLParams(upscaledImageLink, {upscaled: true}), {"x-force-upscale": "true"})
            if (upscaledResponse.byteLength) {
                const decrypted = await functions.crypto.decryptBuffer(upscaledResponse, upscaledImageLink, session)
                const upscaledBlob = new Blob([new Uint8Array(decrypted)])
                const upscaledFile: SourceFile = new File([upscaledBlob], path.basename(upscaledImageLink))
                upscaledFile.altSource = post.images[i].altSource
                upscaledFile.directLink = post.images[i].directLink
                upscaledFiles.push(upscaledFile)
                upscaledLinks.push(upscaledImageLink)
            }
        }
        await validate(upscaledFiles, upscaledLinks, true)
        await validate(files, links, false)

        const parsedTags = props.unverified ? await functions.tag.parseTagsUnverified([post as UnverifiedPost]) 
            : await functions.tag.parseTags([post], session, setSessionFlag)
        const tagCategories = await functions.tag.tagCategories(parsedTags, session, setSessionFlag)

        let artists = [{}] as UploadTag[]
        for (let i = 0; i < tagCategories.artists.length; i++) {
            if (!artists[i]) artists[i] = {}
            artists[i].tag = tagCategories.artists[i].tag
            if (tagCategories.artists[i].image) {
                try {
                    const imageLink = functions.util.removeQueryParams(functions.link.getTagLink(tagCategories.artists[i]))
                    artists[i].image = imageLink
                    const arrayBuffer = await functions.http.getBuffer(imageLink)
                    if (!arrayBuffer?.byteLength) throw "bad"
                    artists[i].ext = path.extname(imageLink).replace(".", "")
                    artists[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    if (props.unverified) {
                        const imageLink = functions.link.getUnverifiedFolderLink("artist", tagCategories.artists[i].image!)
                        artists[i].image = imageLink
                        const arrayBuffer = await functions.http.getBuffer(imageLink)
                        artists[i].ext = path.extname(imageLink).replace(".", "")
                        artists[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                    }
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
                    const imageLink = functions.util.removeQueryParams(functions.link.getTagLink(tagCategories.characters[i]))
                    characters[i].image = imageLink
                    const arrayBuffer = await functions.http.getBuffer(imageLink)
                    if (!arrayBuffer.byteLength) throw "bad"
                    characters[i].ext = path.extname(imageLink).replace(".", "")
                    characters[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    if (props.unverified) {
                        const imageLink = functions.link.getUnverifiedFolderLink("character", tagCategories.characters[i].image!)
                        characters[i].image = imageLink
                        const arrayBuffer = await functions.http.getBuffer(imageLink)
                        characters[i].ext = path.extname(imageLink).replace(".", "")
                        characters[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                    }
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
                    const imageLink = functions.util.removeQueryParams(functions.link.getTagLink(tagCategories.series[i]))
                    series[i].image = imageLink
                    const arrayBuffer = await functions.http.getBuffer(imageLink)
                    if (!arrayBuffer.byteLength) throw "bad"
                    series[i].ext = path.extname(imageLink).replace(".", "")
                    series[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                } catch {
                    if (props.unverified) {
                        const imageLink = functions.link.getUnverifiedFolderLink("series", tagCategories.series[i].image!)
                        series[i].image = imageLink
                        const arrayBuffer = await functions.http.getBuffer(imageLink)
                        series[i].ext = path.extname(imageLink).replace(".", "")
                        series[i].bytes = Object.values(new Uint8Array(arrayBuffer))
                    }
                }
            }
        }
        setSeries(series)
        setMetaTags(tagCategories.meta.map((m) => m.tag).join(" "))
        setRawTags(functions.tag.parseTagGroupsField(tagCategories.tags.map((t) => t.tag), post.tagGroups))
        setEdited(false)
    }

    useEffect(() => {
        if (!edited) setEdited(true)
    }, [type, rating, style, sourceTitle, sourceArtist, sourceCommentary, sourceEnglishCommentary, sourceMirrors, sourceEnglishTitle,
        sourceLink, sourceBookmarks, sourceBuyLink, sourcePixivTags, sourceDrawingTools, sourceUserProfile, sourceImageCount, sourceDate, 
        originalFiles, upscaledFiles, artists, characters, series, rawTags])

    useEffect(() => {
        if (props.edit && postID) updatePost()
    }, [postID, session])

    useEffect(() => {
        if (post) updateFields()
    }, [post])

    const parseLinkParam = async () => {
        const linkParam = new URLSearchParams(window.location.search).get("link")
        if (linkParam) {
            const url = decodeURIComponent(linkParam)
            const files = await functions.http.proxyImage(url, session, setSessionFlag)
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
        if (props.edit) {
            if (props.unverified) {
                functions.dom.changeTitle(i18n.pages.edit.unverifiedTitle, i18n)
            } else {
                functions.dom.changeTitle(i18n.pages.edit.title, i18n)
            }
        } else {
            functions.dom.changeTitle(i18n.buttons.upload, i18n)
        }
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const updatePending = async () => {
        const pending = await functions.http.get("/api/post/pending", null, session, setSessionFlag)
        setPending(pending)
   }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            if (props.edit) {
                setRedirect(`/edit-post/${postID}/${slug}`)
            } else {
                setRedirect("/upload")
            }
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        } else if (!session.emailVerified) {
            navigate("/posts")
            setSidebarText(i18n.sidebar.emailVerificationRequired)
        }
        updatePending()
    }, [session])

    const getSimilar = async () => {
        if (props.edit) return
        let currentFiles = getCurrentFiles()
        if (currentFiles[currentIndex]) {
            const img = currentFiles[currentIndex]
            let dupes = [] as Post[]
            if (img.thumbnail) {
                const bytes = await functions.byte.base64toUint8Array(img.thumbnail).then((r) => Object.values(r))
                dupes = await functions.http.post("/api/search/similar", {bytes}, session, setSessionFlag)
            } else {
                dupes = await functions.http.post("/api/search/similar", {bytes: Object.values(img.bytes)}, session, setSessionFlag)
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

    const validate = async (files: File[], links?: string[], forceUpscale?: boolean) => {
        let {images, error} = await functions.image.validateImages(files, links, session, i18n)
        if (error) {
            setUploadError(true)
            if (!uploadErrorRef.current) await functions.timeout(20)
            uploadErrorRef.current!.innerText = error
            await functions.timeout(3000)
            setUploadError(false)
        } else {
            if (images[0]) setCurrentImg(images[0].link)
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

    useEffect(() => {
        const testFormats = async () => {
            const buffer = await functions.http.getBuffer(currentImg)
            setCurrentAnimatedWebp(functions.file.isAnimatedWebp(buffer))
            setCurrentAnimatedPng(functions.file.isAnimatedPng(buffer))
            setCurrentPixivUgoira(await functions.file.isUgoiraZip(buffer))
            setCurrentLive2D(await functions.file.isLive2DZip(buffer))
        }
        testFormats()
    }, [currentImg])

    const reset = () => {
        setParentID("")
        setOriginalID("")
        setGroupName("")
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
        setSourcePixivTags("")
        setSourceDrawingTools("")
        setSourceUserProfile("")
        setSourceImageCount("")
        setRawTags("")
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
        const item = await functions.image.validateTagImage(file)
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
        const tagDetail = await functions.http.get("/api/tag", {tag}, session, setSessionFlag).catch(() => null)
        if (!tagDetail) return
        if (tagDetail.image) {
            const tagLink = functions.util.removeQueryParams(functions.link.getTagLink(tagDetail))
            const arrayBuffer = await functions.http.getBuffer(tagLink)
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
                <SearchSuggestions active={artistActive[i]} x={getX()} y={getY()} width={mobile ? 150 : 200} text={functions.render.getTypingWord(artistInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="artist"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.artistTag}: </span>
                    <input ref={artistInputRefs[i]} className="upload-input-wide artist-tag-color" type="text" value={artists[i].tag} 
                    onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.artistImage}: </span>
                    <label htmlFor={`artist-upload-${i}`} className="upload-button">
                            <UploadIcon className="upload-button-img-small"/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`artist-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "artist", i)}/>
                    {artists[i].image ? 
                    <XIcon className="upload-x-button" onClick={() => deleteImage()}/>
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
                <SearchSuggestions active={characterActive[i]} x={getX()} y={getY()} width={mobile ? 110 : 200} text={functions.render.getTypingWord(characterInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="character"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.characterTag}: </span>
                    <input ref={characterInputRefs[i]} className="upload-input-wide character-tag-color" type="text" value={characters[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.characterImage}: </span>
                    <label htmlFor={`character-upload-${i}`} className="upload-button">
                            <UploadIcon className="upload-button-img-small"/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`character-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "character", i)}/>
                    {characters[i].image ? 
                    <XIcon className="upload-x-button" onClick={() => deleteImage()}/>
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
                <SearchSuggestions active={seriesActive[i]} x={getX()} y={getY()} width={mobile ? 140 : 200} text={functions.render.getTypingWord(seriesInputRefs[i]?.current)} click={(tag) => handleTagClick(tag, i)} type="series"/>
                <div className="upload-container-row" style={{marginTop: "10px"}}>
                    <span className="upload-text">{i18n.pages.upload.seriesTag}: </span>
                    <input ref={seriesInputRefs[i]} className="upload-input-wide series-tag-color" type="text" value={series[i].tag} onChange={(event) => changeTagInput(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onFocus={() => changeActive(true)} onBlur={() => changeActive(false)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text margin-right">{i18n.pages.upload.seriesImage}: </span>
                    <label htmlFor={`series-upload-${i}`} className="upload-button">
                            <UploadIcon className="upload-button-img-small"/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`series-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "series", i)}/>
                    {series[i].image ? 
                    <XIcon className="upload-x-button" onClick={() => deleteImage()}/>
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

    const setDup = (img: string, index: number, newTab: boolean) => {
        setCurrentDupIndex(index)
        const dupPost = dupPosts[index]
        if (newTab) {
            window.open(`/post/${dupPost.postID}/${dupPost.slug}`, "_blank")
        } else {
            navigate(`/post/${dupPost.postID}/${dupPost.slug}`)
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
        let {tags, tagGroups} = functions.tag.parseTagGroups(functions.util.cleanHTML(rawTags))
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
            const splitTags = functions.util.cleanHTML(rawTags).split(",").map((t: string) => t.trim().replaceAll(" ", "-"))
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
        if (props.edit && !edited && !permissions.isMod(session)) {
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
        if (props.edit && !reason && !permissions.isMod(session)) {
            setSubmitError(true)
            if (!submitErrorRef.current) await functions.timeout(20)
            submitErrorRef.current!.innerText = i18n.pages.edit.reasonRequired
            await functions.timeout(3000)
            return setSubmitError(false)
        }
        setSubmitError(true)
        if (!submitErrorRef.current) await functions.timeout(20)
        submitErrorRef.current!.innerText = i18n.buttons.submitting

        let {imageChunks, upscaledChunks} = functions.byte.chunkImages(originalFiles, upscaledFiles)
        await functions.byte.uploadChunks(imageChunks, upscaledChunks, session, setSessionFlag)

        const data = {
            imageChunks,
            upscaledChunks,
            type,
            rating,
            style,
            parentID,
            groupName,
            sourceLinks,
            source: {
                title: sourceTitle,
                englishTitle: sourceEnglishTitle,
                artist: sourceArtist,
                posted: sourceDate,
                source: sourceLink,
                commentary: sourceCommentary,
                englishCommentary: sourceEnglishCommentary,
                bookmarks: functions.util.safeNumber(sourceBookmarks),
                pixivTags: sourcePixivTags.trim() ? sourcePixivTags.split(",") : null,
                userProfile: sourceUserProfile,
                drawingTools: sourceDrawingTools.trim() ? sourceDrawingTools.split(",") : null,
                sourceImageCount: functions.util.safeNumber(sourceImageCount),
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
        } as UploadableParams
        if (props.edit) {
            if (props.unverified) {
                data.unverifiedID = postID
                data.postID = originalID
            } else {
                data.postID = postID
                data.reason = reason
            }
        }
        try {
            if (props.edit) {
                if (props.unverified) {
                    await functions.http.put("/api/post/edit/unverified", data, session, setSessionFlag)
                } else {
                    if (permissions.isContributor(session)) {
                        await functions.http.put("/api/post/edit", data, session, setSessionFlag)
                    } else {
                        await functions.http.put("/api/post/edit/unverified", data, session, setSessionFlag)
                        setNeedsPermission(true)
                    }
                }
            } else {
                if (permissions.isCurator(session)) {
                    await functions.http.post("/api/post/upload", data, session, setSessionFlag)
                } else {
                    await functions.http.post("/api/post/upload/unverified", data, session, setSessionFlag)
                }

            }
            setSubmitted(true)
            functions.cache.clearCache()
            return setSubmitError(false)
        } catch (err: any) {
            if (String(err)?.includes("403")) {
                try {
                    await functions.http.put("/api/post/edit/unverified", data, session, setSessionFlag)
                    setNeedsPermission(true)
                    setSubmitted(true)
                    return setSubmitError(false)
                } catch (err: any) {
                    let errMsg = i18n.pages.upload.error
                    if (err.message.includes("Invalid images")) errMsg = i18n.pages.upload.errorImages
                    if (!submitErrorRef.current) await functions.timeout(20)
                    submitErrorRef.current!.innerText = errMsg
                    await functions.timeout(3000)
                    return setSubmitError(false)
                }
            } else {
                let errMsg = i18n.pages.upload.error
                if (err.message.includes("Invalid images")) errMsg = i18n.pages.upload.errorImages
                if (!submitErrorRef.current) await functions.timeout(20)
                submitErrorRef.current!.innerText = errMsg
                await functions.timeout(3000)
                return setSubmitError(false)
            }
        }
    }

    const sourceLookup = async () => {
        setSourceError(true)
        if (!sourceErrorRef.current) await functions.timeout(20)
        sourceErrorRef.current!.innerText = i18n.buttons.fetching
        if (saucenaoTimeout) {
            sourceErrorRef.current!.innerText = i18n.pages.upload.wait
            await functions.timeout(3000)
            return setSourceError(false)
        }
        try {
            saucenaoTimeout = true
            const currentFiles = getCurrentFiles()
            let current = currentFiles[currentIndex]
    
            const sourceLookup = await functions.http.post("/api/misc/sourcelookup", {current, rating}, session, setSessionFlag)
            if (sourceLookup.artists[0]?.tag) {
                artists[artists.length - 1].tag = sourceLookup.artists[0].tag
                if (sourceLookup.artistIcon) {
                    const pfp = await functions.http.proxyImage(sourceLookup.artistIcon, session, setSessionFlag).then((r) => r[0])
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
            setSourcePixivTags(sourceLookup.source.pixivTags.join(", "))
            setSourceDrawingTools(sourceLookup.source.drawingTools.join(", "))
            setSourceUserProfile(sourceLookup.source.userProfile)
            setSourceImageCount(String(sourceLookup.source.sourceImageCount || ""))
            setSourceDate(sourceLookup.source.posted)
            setSourceMirrors(sourceLookup.source.mirrors)
            if (!sourceLookup.source.title && !sourceLookup.source.artist && !sourceLookup.source.source) {
                sourceErrorRef.current!.innerText = i18n.pages.upload.noResults
                await functions.timeout(3000)
            }
            if (artists.length > 1) artists.pop()
            setArtists(artists)
            setSourceLinks(sourceLookup.sourceLinks)
            forceUpdate()
        } catch (e) {
            console.log(e)
            sourceErrorRef.current!.innerText = i18n.pages.upload.noResults
            await functions.timeout(3000)
        } finally {
            setSourceError(false)
            setTimeout(async () => {
                saucenaoTimeout = false
            }, 3000)
        }
    }

    const tagLookup = async () => {
        setTagError(true)
        if (!tagErrorRef.current) await functions.timeout(20)
        tagErrorRef.current!.innerText = i18n.buttons.fetching
        try {
            const currentFiles = getCurrentFiles()
            let current = currentFiles[currentIndex]
            let hasUpscaled = upscaledFiles.length ? true : false
            const tagLookup = await functions.http.post("/api/misc/taglookup", {current, type, rating, style, hasUpscaled}, session, setSessionFlag)

            let characters = [{}] as UploadTag[]
            let characterInputRefs = [] as React.RefObject<HTMLInputElement | null>[]
            for (let i = 0; i < tagLookup.characters.length; i++) {
                if (!tagLookup.characters[i]?.tag) continue
                characters[characters.length - 1].tag = tagLookup.characters[i].tag
                characters[characters.length - 1].image = ""
                const tagDetail = await functions.http.get("/api/tag", {tag: tagLookup.characters[i].tag!}, session, setSessionFlag).catch(() => null)
                if (tagDetail?.image) {
                    const tagLink = functions.util.removeQueryParams(functions.link.getTagLink(tagDetail))
                    const arrayBuffer = await functions.http.getBuffer(tagLink)
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
            let seriesInputRefs = [] as React.RefObject<HTMLInputElement | null>[]
            for (let i = 0; i < tagLookup.series.length; i++) {
                if (!tagLookup.series[i]?.tag) continue
                series[series.length - 1].tag = tagLookup.series[i].tag
                series[series.length - 1].image = ""
                const tagDetail = await functions.http.get("/api/tag", {tag: tagLookup.series[i].tag!}, session, setSessionFlag).catch(() => null)
                if (tagDetail?.image) {
                    const tagLink = functions.util.removeQueryParams(functions.link.getTagLink(tagDetail))
                    const arrayBuffer = await functions.http.getBuffer(tagLink)
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
            setRating(tagLookup.rating)
        } catch (e) {
            console.log(e)
            tagErrorRef.current!.innerText = i18n.pages.upload.nothingFound
            await functions.timeout(3000)
        } finally {
            setTagError(false)
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
        setNeedsPermission(false)
    }

    useEffect(() => {
        updateTags()
    }, [rawTags, session])

    const updateTags = async () => {
        const {tags} = functions.tag.parseTagGroups(functions.util.cleanHTML(rawTags))
        clearTimeout(tagsTimer)
        tagsTimer = setTimeout(async () => {
            if (!tags?.[0]) return setNewTags([])
            const tagMap = await functions.cache.tagCountsCache(session, setSessionFlag)
            let notExists = [] as UploadTag[]
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], description: `${functions.util.toProperCase(tags[i]).replaceAll("-", " ")}.`})
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
                            <UploadIcon className="upload-button-img-small"/>
                            <span className="upload-button-text-small">{i18n.buttons.upload}</span>
                    </label>
                    <input id={`tag-upload-${i}`} type="file" onChange={(event) => uploadTagImg(event, "tag", i)}/>
                    {newTags[i].image ? 
                    <XIcon className="upload-x-button" onClick={() => deleteImage()}/>
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
        const tagX = functions.render.getTagX()
        const tagY = functions.render.getTagY()
        setTagX(tagX)
        setTagY(tagY)
    }, [metaTags, rawTags])

    useEffect(() => {
        if (metaActive || tagActive) {
            const tagX = functions.render.getTagX()
            const tagY = functions.render.getTagY()
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [metaActive, tagActive])

    const setCaretPosition = (ref: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null) => {
        caretPosition = functions.render.getCaretPosition(ref)
    }

    const handleRawTagClick = (tag: string) => {
        setRawTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const handleMetaTagClick = (tag: string) => {
        setMetaTags((prev: string) => functions.render.insertAtCaret(prev, caretPosition, tag))
    }

    const openPost = async (event: React.MouseEvent) => {
        if (props.unverified) return navigate(`/unverified/post/${postID}`)
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    useEffect(() => {
        if (sourceHook !== null) {
            let original = originalFiles[currentIndex]
            if (original) {
                let newOriginal = {...original, ...sourceHook}
                let newOriginalFiles = functions.util.replaceAtIndex(originalFiles, currentIndex, newOriginal)
                setOriginalFiles(newOriginalFiles)
            }
            let upscaled = upscaledFiles[currentIndex]
            if (upscaled) {
                let newUpscaled = {...upscaled, ...sourceHook}
                let newUpscaledFiles = functions.util.replaceAtIndex(upscaledFiles, currentIndex, newUpscaled)
                setUpscaledFiles(newUpscaledFiles)
            }
            setSourceHook(null)
        }
    }, [sourceHook, originalFiles, upscaledFiles, currentIndex])

    const getPostJSX = () => {
        const currentFiles = getCurrentFiles()
        const uploadImage = currentFiles[currentIndex]
        if (currentLive2D) {
            return <PostLive2D live2d={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        } else if (functions.file.isModel(currentImg)) {
            return <PostModel model={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        } else if (functions.file.isAudio(currentImg)) {
            return <PostSong audio={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        } else if (functions.file.isVideo(currentImg)) {
            return <PostVideo video={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        } else if (functions.file.isGIF(currentImg) || currentAnimatedWebp || currentAnimatedPng || currentPixivUgoira) {
            return <PostAnimation anim={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        } else {
            return <PostImage img={currentImg} noKeydown={true} noNotes={true} uploadImage={uploadImage}/>
        }
    }

    const getStyleJSX = () => {
        if (type === "model") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                        <$3dIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                    </button>
                    <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                        <ChibiIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <PixelIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                </div>
            )
        } else if (type === "audio") {
            return (
                <div className="upload-row">
                    <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                        <$2dIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                    </button>
                    <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                        <PixelIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                    </button>
                    <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                        <SketchIcon className="upload-button-img"/>
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
                            <$2dIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                        </button>
                        {type !== "live2d" ? <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                            <$3dIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                        </button> : null}
                        <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                            <ChibiIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                        </button>
                        <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                            <PixelIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                        </button>
                    </div>
                    <div className="upload-row">
                        {type !== "comic" ?
                        <button className={`upload-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                            <DakiIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.daki}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                            <PromoIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.promo}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                            <SketchIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.sketch}</span>
                        </button> : null}
                    </div>
                    <div className="upload-row">
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                            <LineartIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.lineart}</span>
                        </button> : null}
                    </div>
                    </>
                )
            } else {
                return (
                    <div className="upload-row">
                        <button className={`upload-button ${style === "2d" ? "button-selected" : ""}`} onClick={() => setStyle("2d")}>
                            <$2dIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style["2d"]}</span>
                        </button>
                        {type !== "live2d" ? <button className={`upload-button ${style === "3d" ? "button-selected" : ""}`} onClick={() => setStyle("3d")}>
                            <$3dIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style["3d"]}</span>
                        </button> : null}
                        <button className={`upload-button ${style === "chibi" ? "button-selected" : ""}`} onClick={() => setStyle("chibi")}>
                            <ChibiIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.chibi}</span>
                        </button>
                        <button className={`upload-button ${style === "pixel" ? "button-selected" : ""}`} onClick={() => setStyle("pixel")}>
                            <PixelIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.pixel}</span>
                        </button>
                        {type !== "comic" ?
                        <button className={`upload-button ${style === "daki" ? "button-selected" : ""}`} onClick={() => setStyle("daki")}>
                            <DakiIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.daki}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "promo" ? "button-selected" : ""}`} onClick={() => setStyle("promo")}>
                            <PromoIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.promo}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "sketch" ? "button-selected" : ""}`} onClick={() => setStyle("sketch")}>
                            <SketchIcon className="upload-button-img"/>
                            <span className="upload-button-text">{i18n.sortbar.style.sketch}</span>
                        </button> : null}
                        {type !== "live2d" ?
                        <button className={`upload-button ${style === "lineart" ? "button-selected" : ""}`} onClick={() => setStyle("lineart")}>
                            <LineartIcon className="upload-button-img"/>
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

    const currentImages = () => {
        if (props.edit && !props.unverified) return getCurrentFiles().map((u) => functions.util.appendURLParams(u.link, {upscaled: showUpscaled}))
        return getCurrentFiles().map((u) => u.link)
    }

    const getUploadJSX = () => {
        if (session.banned) {
            return (
                <>
                <span className="upload-ban-text">{props.edit ? i18n.pages.edit.banText : i18n.pages.upload.banText}</span>
                <button className="upload-button" onClick={() => navigate(-1)}
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
                <button className="upload-button" onClick={() => navigate(-1)}
                style={{width: "max-content", marginTop: "10px", marginLeft: "10px", backgroundColor: "var(--banText)"}}>
                        <span className="upload-button-submit-text">←{i18n.buttons.back}</span>
                </button>
                </>
            )
        }

        if (functions.post.currentUploads(pending) >= permissions.getUploadLimit(session)) {
            return (
                <>
                <span className="upload-text" style={{marginTop: "10px", 
                marginLeft: "10px", fontSize: "20px"}}>{i18n.pages.upload.limitReached}</span>
                <button className="upload-button" onClick={() => navigate(-1)}
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
                    <span className="upload-heading">{props.edit ? i18n.pages.edit.title : i18n.buttons.upload}</span>
                    {!props.edit ? (hideGuidelines ?
                        <DownloadIcon className="upload-heading-icon" onClick={() => setHideGuidelines((prev) => !prev)}/> :
                        <UploadIcon className="upload-heading-icon" onClick={() => setHideGuidelines((prev) => !prev)}/>) : null}
                </div>
                {submitted ?
                <div className="upload-container">
                    <div className="upload-container-row">
                        {props.edit ? 
                        /* Edit */
                        needsPermission ?
                        <span className="upload-text-alt">{i18n.pages.edit.submitHeadingApproval}</span> :
                        <span className="upload-text-alt">{i18n.pages.edit.submitHeading}</span> : 
                        /* Upload */
                        permissions.isMod(session) ?
                        <span className="upload-text-alt">{i18n.pages.upload.submitHeading}</span> :
                        <span className="upload-text-alt">{i18n.pages.upload.submitHeadingApproval}</span>}
                    </div> 
                    <div className="upload-container-row" style={{marginTop: "10px"}}>
                        {props.edit ?
                        <button className="upload-button" onClick={(event) => {openPost(event); setPostFlag(postID)}}>
                                <span className="upload-button-text">←{i18n.buttons.back}</span>
                        </button> :
                        <button className="upload-button" onClick={resetAll}>
                                <span className="upload-button-text">←{i18n.pages.upload.submitMore}</span>
                        </button>}
                    </div>
                </div> : <>
                {!hideGuidelines && !props.edit ? <div className="upload-guidelines">
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line1}<span className="upload-guideline-link" onClick={() => navigate(`/help#uploading`)}>{i18n.pages.upload.guidelines.uploadingGuidelines}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line2}<span className="upload-guideline-link" onClick={() => navigate(`/help#compressing`)}>{i18n.pages.upload.guidelines.compressingGuide}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line3}<span className="upload-guideline-link" onClick={() => navigate(`/help#upscaling`)}>{i18n.pages.upload.guidelines.upscalingGuide}</span></span>
                    <span className="upload-guideline">{i18n.pages.upload.guidelines.line4}<span className="upload-guideline-link" onClick={() => navigate(`/help#variations`)}>{i18n.pages.upload.guidelines.variation}</span>{i18n.pages.upload.guidelines.or}<span className="upload-guideline-link" onClick={() => navigate(`/help#child-posts`)}>{i18n.pages.upload.guidelines.childPost}</span></span>
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
                        <UploadIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                        <LinkIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.labels.enterLinks}</span>
                    </button>
                </div>
                <div className="upload-row">
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                        {showUpscaled ?
                        <UpscaleIcon className="upload-button-img"/> :
                        <OriginalIcon className="upload-button-img"/>}
                        <span className="upload-button-text">{showUpscaled ? i18n.labels.upscaled : i18n.labels.original}</span>
                    </button>
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <LeftIcon className="upload-button-img"/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <XIcon className="upload-button-img"/>
                    </button>
                    : null}
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <RightIcon className="upload-button-img"/>
                    </button> : null}
                </div> </>
                :
                <div className="upload-row">
                    <label htmlFor="file-upload" className="upload-button">
                        <UploadIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.labels.selectFiles}</span>
                    </label>
                    <input id="file-upload" type="file" multiple onChange={(event) => upload(event)}/>
                    <button className="upload-button" onClick={() => setShowLinksInput((prev) => !prev)}>
                        <LinkIcon className="upload-button-img"/>
                        <span className="upload-button-text">{i18n.labels.enterLinks}</span>
                    </button>
                    <button className="upload-button" onClick={() => changeUpscaled()}>
                        {showUpscaled ?
                        <UpscaleIcon className="upload-button-img"/> :
                        <OriginalIcon className="upload-button-img"/>}
                            <span className="upload-button-text">{showUpscaled ? i18n.labels.upscaled : i18n.labels.original}</span>
                    </button>
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={left}>
                        <LeftIcon className="upload-button-img"/>
                    </button> : null}
                    {currentImg ? 
                    <button className="upload-button" onClick={clear}>
                        <XIcon className="upload-button-img"/>
                    </button>
                    : null}
                    {getCurrentFiles().length > 1 ?
                    <button className="upload-button" onClick={right}>
                        <RightIcon className="upload-button-img"/>
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
                    <Carousel images={currentImages()} set={set} index={currentIndex} unlimited={true}/>
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
                    <ImageIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <AnimationIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.animation}</span>
                </button>
            </div>
            <div className="upload-row">
                <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <VideoIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <ComicIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.comic}</span>
                </button>
            </div>
            <div className="upload-row">
                <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <AudioIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <Live2dIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
            </div> 
            <div className="upload-row">
                <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <ModelIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div> </>
            :
            <div className="upload-row">
                <button className={`upload-button ${type === "image" ? "button-selected" : ""}`} onClick={() => setType("image")}>
                    <ImageIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.image}</span>
                </button>
                <button className={`upload-button ${type === "animation" ? "button-selected" : ""}`} onClick={() => setType("animation")}>
                    <AnimationIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.animation}</span>
                </button>
                <button className={`upload-button ${type === "video" ? "button-selected" : ""}`} onClick={() => setType("video")}>
                    <VideoIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.video}</span>
                </button>
                <button className={`upload-button ${type === "comic" ? "button-selected" : ""}`} onClick={() => setType("comic")}>
                    <ComicIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.comic}</span>
                </button>
                <button className={`upload-button ${type === "audio" ? "button-selected" : ""}`} onClick={() => setType("audio")}>
                    <AudioIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.audio}</span>
                </button>
                <button className={`upload-button ${type === "live2d" ? "button-selected" : ""}`} onClick={() => setType("live2d")}>
                    <Live2dIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.live2d}</span>
                </button>
                <button className={`upload-button ${type === "model" ? "button-selected" : ""}`} onClick={() => setType("model")}>
                    <ModelIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.type.model}</span>
                </button>
            </div>}
            {mobile ? <>
            <div className="upload-row">
                <button className={`upload-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <CuteIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`upload-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <SexyIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`upload-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                    <EroticIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.erotic}</span>
                </button>
            </div>
            <div className="upload-row">
                {session.showR18 ?
                <button className={`upload-button ${rating === "lewd" ? "button-selected" : ""}`} onClick={() => setRating("lewd")}>
                    <LewdIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.lewd}</span>
                </button> : null}
            </div> </>
            :
            <div className="upload-row">
                <button className={`upload-button ${rating === "cute" ? "button-selected" : ""}`} onClick={() => setRating("cute")}>
                    <CuteIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.cute}</span>
                </button>
                <button className={`upload-button ${rating === "sexy" ? "button-selected" : ""}`} onClick={() => setRating("sexy")}>
                    <SexyIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.sexy}</span>
                </button>
                <button className={`upload-button ${rating === "erotic" ? "button-selected" : ""}`} onClick={() => setRating("erotic")}>
                    <EroticIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.erotic}</span>
                </button>
                {session.showR18 ?
                <button className={`upload-button ${rating === "lewd" ? "button-selected" : ""}`} onClick={() => setRating("lewd")}>
                    <LewdIcon className="upload-button-img"/>
                    <span className="upload-button-text">{i18n.sortbar.rating.lewd}</span>
                </button> : null}
            </div>}
            {getStyleJSX()}
            {dupPosts.length ? <>
            <span className="upload-heading">{i18n.pages.upload.possibleDuplicates}</span>
            <div className="upload-row">
                <Carousel images={dupPosts.map((p) => functions.link.getThumbnailLink(p.images[0], "tiny", session))} set={setDup} index={currentDupIndex} unlimited={true}/>
            </div>
            </> : null}
            <div className="upload-container">
                <div className="upload-container-row">
                    <span className="upload-text-alt">{i18n.pages.upload.childHeading}</span>
                    <input className="upload-input" type="number" value={parentID} onChange={(event) => setParentID(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text-alt">{i18n.pages.upload.groupHeading}</span>
                    <input className="upload-input-wide" type="text" value={groupName} onChange={(event) => setGroupName(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
            </div>
            <span className="upload-heading">{i18n.labels.source}</span>
            <div className="upload-container">
                {sourceError ? <span ref={sourceErrorRef} className="submit-error-text"></span> : null}
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
                    <span className="upload-text">{i18n.labels.userProfile}: </span>
                    <input className="upload-input-wide2" type="url" value={sourceUserProfile} onChange={(event) => setSourceUserProfile(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.sort.bookmarks}: </span>
                    <input className="upload-input-wide" type="number" value={sourceBookmarks} onChange={(event) => setSourceBookmarks(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.imageCount}: </span>
                    <input className="upload-input-wide" type="number" value={sourceImageCount} onChange={(event) => setSourceImageCount(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.pixivTags}: </span>
                    <input className="upload-input-wide2" type="url" value={sourcePixivTags} onChange={(event) => setSourcePixivTags(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                </div>
                <div className="upload-container-row">
                    <span className="upload-text">{i18n.labels.drawingTools}: </span>
                    <input className="upload-input-wide2" type="url" value={sourceDrawingTools} onChange={(event) => setSourceDrawingTools(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
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
                <SearchSuggestions active={metaActive} text={functions.render.getTypingWord(metaTagRef.current)} x={tagX} y={tagY} width={200} click={handleMetaTagClick} type="meta"/>
                <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                    <input style={{width: "40%"}} ref={metaTagRef} className="upload-input meta-tag-color" spellCheck={false} value={metaTags} onChange={(event) => {setCaretPosition(metaTagRef.current); setMetaTags(event.target.value)}} onFocus={() => setMetaActive(true)} onBlur={() => setMetaActive(false)}/>
                </div>
            </div>
            {displayImage && getCurrentFiles().length ?
            <div className="upload-row">
                {functions.file.isVideo(currentImg) ? 
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
            {tagError ? <span ref={tagErrorRef} className="submit-error-text"></span> : null}
            <span className="upload-link" onClick={tagLookup} style={{marginBottom: "5px"}}>{i18n.pages.upload.fetchFromDanbooru}</span>
            <span className="upload-text-alt">{i18n.pages.upload.enterTags}
            <Link className="upload-bold-link" target="_blank" to="/help#tagging">{i18n.pages.upload.taggingGuide}</Link>
            {i18n.pages.upload.organizeTags}
            <Link className="upload-bold-link" target="_blank" to="/help#tag-groups">{i18n.pages.upload.tagGroups}</Link></span>
            <div className="upload-container">
                <SearchSuggestions active={tagActive} text={functions.render.getTypingWord(rawTagRef.current)} x={tagX} y={tagY} width={200} click={handleRawTagClick} type="tags"/>
                <div className="upload-container-row" onMouseOver={() => setEnableDrag(false)}>
                    <ContentEditable innerRef={rawTagRef} className="upload-textarea" spellCheck={false} html={rawTags} onChange={(event) => {setCaretPosition(rawTagRef.current); setRawTags(event.target.value)}} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                </div>
            </div>
            {props.edit && !props.unverified ?
            <div className="upload-row">
                <span className="upload-text">{i18n.pages.edit.editReason}: </span>
                <input style={{width: "100%"}} className="upload-input-wide2" type="text" value={reason} onChange={(event) => setReason(event.target.value)} spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
            </div> : null}
            {newTags.length ? <>
            <span className="upload-heading">{i18n.labels.newTags}</span>
            <div className="upload-container">
                {generateTagsJSX()}
            </div>
            </> : null}
            <div className="upload-center-row">
                {submitError ? <span ref={submitErrorRef} className="submit-error-text"></span> : null}
                {props.edit ? 
                <div className="upload-submit-button-container">
                    <button className="upload-button" onClick={(event) => openPost(event)}>
                            <span className="upload-button-submit-text">{i18n.buttons.cancel}</span>
                    </button>
                    <button className="upload-button" onClick={() => submit()}>
                            <span className="upload-button-submit-text">{i18n.buttons.edit}</span>
                    </button>
                </div> :
                <button className="upload-button" onClick={() => submit()}>
                        <span className="upload-button-submit-text">{i18n.buttons.submit}</span>
                </button>}
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