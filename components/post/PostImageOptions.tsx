import React, {useEffect, useRef, useState} from "react"
import {useInteractionActions, useLayoutSelector,  
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, 
useSessionActions, useCacheSelector, useGroupDialogActions,
useCacheActions} from "../../store"
import functions from "../../structures/Functions"
import star from "../../assets/icons/star.png"
import starFavorited from "../../assets/icons/starFavorited.png"
import starGroup from "../../assets/icons/stargroup.png"
import starGroupFavorited from "../../assets/icons/stargroup-favorited.png"
import download from "../../assets/icons/download.png"
import filters from "../../assets/icons/filters.png"
import nextIcon from "../../assets/icons/next.png"
import prevIcon from "../../assets/icons/prev.png"
import "./styles/postimageoptions.less"
import imageFunctions from "../../structures/ImageFunctions"
import Filters from "./Filters"
import {PostFull, PostHistory, UnverifiedPost} from "../../types/Types"

interface Props {
    img?: string
    model?: string
    live2d?: string
    audio?: string
    post?: PostFull | PostHistory | UnverifiedPost
    comicPages?: string[] | null
    download: () => void
    previous?: () => void
    next?: () => void
    noFavorite?: boolean
}

const PostImageOptions: React.FunctionComponent<Props> = (props) => {
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {noteMode, format} = useSearchSelector()
    const {setFormat} = useSearchActions()
    const {posts} = useCacheSelector()
    const {setPosts} = useCacheActions()
    const {setFavGroupID} = useGroupDialogActions()
    const [favorited, setFavorited] = useState(false)
    const [favGrouped, setFavGrouped] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [showFormatDropdown, setShowFormatDropdown] = useState(false)
    const [downloadText, setDownloadText] = useState("")
    const filterRef = useRef<HTMLDivElement>(null)
    const formatRef = useRef<HTMLButtonElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        getFavorite()
        const savedDownloadText = localStorage.getItem("downloadText")
        if (savedDownloadText) setDownloadText(savedDownloadText)
    }, [])

    useEffect(() => {
        localStorage.setItem("downloadText", downloadText)
    }, [downloadText])

    useEffect(() => {
        const getDLText = async () => {
            let decrypted = props.img || ""
            if (props.img) {
                if (!functions.isVideo(props.img)) {
                    decrypted = await functions.decryptItem(props.img, session)
                }
                if (props.comicPages) {
                    let sizeTotal = 0
                    for (let i = 0; i < props.comicPages.length; i++) {
                        const miniDecrypt = await functions.decryptItem(props.comicPages[i], session)
                        let {size} = await imageFunctions.dimensions(miniDecrypt)
                        sizeTotal += size
                    }
                    setDownloadText(`${props.comicPages.length} ${i18n.sortbar.pages.toLowerCase()} (${functions.readableFileSize(sizeTotal)})`)
                } else {
                    let {width, height, size} = await imageFunctions.dimensions(decrypted)
                    setDownloadText(`${width}x${height} (${functions.readableFileSize(size)})`)
                }
            } else if (props.model) {
                decrypted = await functions.decryptItem(props.model, session)
                let {polycount, size} = await imageFunctions.dimensions(decrypted)
                setDownloadText(`${functions.readablePolycount(polycount!)} (${functions.readableFileSize(size)})`)
            } else if (props.audio) {
                decrypted = await functions.decryptItem(props.audio, session)
                let {duration, size} = await imageFunctions.dimensions(decrypted)
                setDownloadText(`${functions.formatSeconds(duration!)} (${functions.readableFileSize(size)})`)
            } else if (props.live2d) {
                decrypted = await functions.decryptItem(props.live2d, session)
                let {width, height, size} = await imageFunctions.dimensions(decrypted)
                setDownloadText(`${width}x${height} (${functions.readableFileSize(size)})`)
            }
        }
        getDLText()
    }, [props.img, props.model, props.audio, props.live2d, props.comicPages, session])

    const getFavorite = async () => {
        if (!props.post || !session.username) return
        const favorite = await functions.get("/api/favorite", {postID: props.post.postID}, session, setSessionFlag)
        setFavorited(favorite ? true : false)
    }

    const getFavgroup = async () => {
        if (!props.post || !session.username) return
        const favgroups = await functions.get("/api/favgroups", {postID: props.post.postID}, session, setSessionFlag)
        setFavGrouped(favgroups?.length ? true : false)
    }

    useEffect(() => {
        getFavorite()
        getFavgroup()
    }, [props.post, session])

    const getStar = () => {
        if (favorited) {
            return starFavorited
        } else {
            return star
        }
    }

    const getStarGroup = () => {
        if (favGrouped) {
            return starGroupFavorited
        } else {
            return starGroup
        }
    }

    const getFilterMarginRight = () => {
        if (typeof document === "undefined") return 0
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return 0
        const raw = window.innerWidth - rect.right
        let offset = -120
        if (mobile) offset += 80
        if (noteMode) offset += 10
        return raw + offset
    }

    const getFilterMarginTop = () => {
        if (typeof document === "undefined") return 0
        let elementName = ".post-image-box"
        if (props.model) elementName = ".post-model-box"
        if (props.live2d) elementName = ".post-model-box"
        if (props.audio) elementName = ".post-song-box"
        if (noteMode) elementName = ".note-editor"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return 0
        const raw = bodyRect.bottom - rect.bottom
        let offset = -250
        if (mobile) offset += 20
        if (session.showR18) offset -= 35
        return raw + offset
    }

    const getFormatMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = formatRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -20
        if (format === "png") offset += 2
        if (format === "webp") offset += 8
        if (format === "avif") offset += 4
        if (format === "svg") offset += 1
        if (mobile) offset += 15
        return `${raw + offset}px`
    }

    const getFormatMarginTop = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".post-image-box"
        if (props.model) elementName = ".post-model-box"
        if (props.live2d) elementName = ".post-model-box"
        if (props.audio) elementName = ".post-song-box"
        if (noteMode) elementName = ".note-editor"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = formatRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = -150
        if (mobile) offset += 35
        return `${raw + offset}px`
    }

    const updateFavorite = async (value: boolean) => {
        if (!props.post || !session.username) return
        await functions.post("/api/favorite/update", {postID: props.post.postID, favorited: value}, session, setSessionFlag)
        functions.updateLocalFavorite(props.post.postID, value, posts, setPosts)
        setFavorited(value)
    }

    const closeDropdowns = () => {
        setShowFilterDropdown(false)
        setShowFormatDropdown(false)
    }

    const toggleDropdown = (dropdown: string) => {
        if (dropdown === "format") {
            if (showFormatDropdown) {
                setShowFormatDropdown(false)
            } else {
                closeDropdowns()
                setShowFormatDropdown(true)
            }
        }
        if (dropdown === "filter") {
            if (showFilterDropdown) {
                setShowFilterDropdown(false)
            } else {
                closeDropdowns()
                setShowFilterDropdown(true)
            }
        }
    }

    useEffect(() => {
        if (showFormatDropdown) setShowFilterDropdown(false)
        if (showFilterDropdown) setShowFormatDropdown(false)
    }, [showFormatDropdown, showFilterDropdown])

    return (
        <div className="post-image-options-container">
            {mobile ? <>
            <div className="post-image-options">
                <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon-small" src={prevIcon} style={{filter: getFilter()}}/>
                    {!session.username ? <div className="post-image-text-small">{i18n.post.prev}</div> : null}
                </div>
                {session.username ?
                <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} style={{marginLeft: "-10px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={getStar()} style={{filter: favorited ? "" : getFilter()}}/>
                    <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? i18n.post.favorited : i18n.post.favorite}</div>
                </div> : null}
                {session.username ?
                <div className="post-image-options-box" onClick={() => setFavGroupID(props.post?.postID!)}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={getStarGroup()} style={{filter: favGrouped ? "" : getFilter()}}/>
                    <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>{i18n.post.favgroup}</div>
                </div> : null}
                <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon-small" src={nextIcon} style={{filter: getFilter()}}/> 
                    {!session.username ? <div className="post-image-text-small">{i18n.post.next}</div> : null}
                </div>
            </div>
            <div className="post-image-options">
                <div className="post-image-options-box" onClick={() => props.download?.()} style={{marginRight: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={download} style={{filter: getFilter()}}/>
                    <div className="post-image-text">{i18n.buttons.download}</div>
                </div>
                {props.post?.type === "image" || props.post?.type === "comic" ? 
                <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                {String(format).toUpperCase()}</button> : null}
                <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} style={{marginLeft: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={filters} style={{filter: getFilter()}}/>
                    <div className="post-image-text">{i18n.filters.filters}</div>
                </div>
            </div> </>
             :
            <div className="post-image-options">
                <div className="post-image-options-left">
                    <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "15px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon-small" src={prevIcon} style={{filter: getFilter()}}/>
                        <div className="post-image-text-small">{i18n.post.prev}</div>
                    </div>
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getStar()} style={{filter: favorited ? "" : getFilter()}}/>
                        <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? i18n.post.favorited : i18n.post.favorite}</div>
                    </div> : null}
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => setFavGroupID(props.post?.postID!)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getStarGroup()} style={{filter: favGrouped ? "" : getFilter()}}/>
                        <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>{i18n.post.favgroup}</div>
                    </div> : null}
                </div>
                <div className="post-image-options-right">
                    <div className="post-image-options-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-alt">{downloadText}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.download?.()} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={download} style={{filter: getFilter()}}/>
                        <div className="post-image-text">{i18n.buttons.download}</div>
                    </div>
                    {props.post?.type === "image" || props.post?.type === "comic" ? 
                    <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                    {String(format).toUpperCase()}</button> : null}
                    <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={filters} style={{filter: getFilter()}}/>
                        <div className="post-image-text">{i18n.filters.filters}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-small">{i18n.post.next}</div>
                        <img className="post-image-icon-small" src={nextIcon} style={{filter: getFilter()}}/>
                    </div>
                </div>
            </div>}
            <div className={`format-dropdown ${showFormatDropdown ? "" : "hide-format-dropdown"}`} style={{marginRight: getFormatMarginRight(), marginTop: getFormatMarginTop()}}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <button className="format-dropdown-button" onClick={() => {setFormat("jpg"); setShowFormatDropdown(false)}}>JPG</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("png"); setShowFormatDropdown(false)}}>PNG</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("webp"); setShowFormatDropdown(false)}}>WEBP</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("avif"); setShowFormatDropdown(false)}}>AVIF</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("jxl"); setShowFormatDropdown(false)}}>JXL</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("svg"); setShowFormatDropdown(false)}}>SVG</button>
            </div>
            <Filters active={showFilterDropdown} right={getFilterMarginRight()} top={getFilterMarginTop()} origin="bottom"/>
        </div>
    )
}

export default PostImageOptions