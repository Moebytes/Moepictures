/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState} from "react"
import {useInteractionActions, useLayoutSelector,  
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, 
useSessionActions, useCacheSelector, useGroupDialogActions, useMiscDialogActions,
useCacheActions, useActiveActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import StarIcon from "../../assets/svg/star.svg"
import StarGroupIcon from "../../assets/svg/stargroup.svg"
import DownloadIcon from "../../assets/svg/download.svg"
import FiltersIcon from "../../assets/svg/filters.svg"
import NextIcon from "../../assets/svg/next.svg"
import PrevIcon from "../../assets/svg/prev.svg"
import Filters from "../../ui/Filters"
import {PostFull, PostHistory, UnverifiedPost} from "../../types/Types"
import "./styles/postimageoptions.less"

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

let timer = null as any

const PostImageOptions: React.FunctionComponent<Props> = (props) => {
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {noteMode, format} = useSearchSelector()
    const {setActionBanner} = useActiveActions()
    const {setFormat} = useSearchActions()
    const {posts} = useCacheSelector()
    const {setPosts} = useCacheActions()
    const {setFavGroupID} = useGroupDialogActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const [favorited, setFavorited] = useState(false)
    const [favGrouped, setFavGrouped] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [showFormatDropdown, setShowFormatDropdown] = useState(false)
    const [downloadText, setDownloadText] = useState("")
    const filterRef = useRef<HTMLDivElement>(null)
    const formatRef = useRef<HTMLButtonElement>(null)

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    useEffect(() => {
        getFavorite()
        const savedDownloadText = localStorage.getItem("downloadText")
        if (savedDownloadText) setDownloadText(savedDownloadText)
    }, [])

    useEffect(() => {
        localStorage.setItem("downloadText", downloadText)
    }, [downloadText])

    const getDLText = async () => {
        let decrypted = props.img || ""
        if (props.img) {
            if (!functions.file.isVideo(props.img)) {
                decrypted = await functions.crypto.decryptItem(props.img, session)
            }
            if (props.comicPages) {
                let sizeTotal = 0
                for (let i = 0; i < props.comicPages.length; i++) {
                    const miniDecrypt = await functions.crypto.decryptItem(props.comicPages[i], session)
                    let {size} = await functions.image.dimensions(miniDecrypt)
                    sizeTotal += size
                }
                setDownloadText(`${props.comicPages.length} ${i18n.sortbar.pages.toLowerCase()} (${functions.util.readableFileSize(sizeTotal)})`)
            } else {
                let {width, height, size} = await functions.image.dimensions(decrypted)
                setDownloadText(`${width}x${height} (${functions.util.readableFileSize(size)})`)
            }
        } else if (props.model) {
            decrypted = await functions.crypto.decryptItem(props.model, session)
            let {polycount, size} = await functions.image.dimensions(decrypted)
            setDownloadText(`${functions.model.readablePolycount(polycount!)} (${functions.util.readableFileSize(size)})`)
        } else if (props.audio) {
            decrypted = await functions.crypto.decryptItem(props.audio, session)
            let {duration, size} = await functions.image.dimensions(decrypted)
            setDownloadText(`${functions.date.formatSeconds(duration!)} (${functions.util.readableFileSize(size)})`)
        } else if (props.live2d) {
            decrypted = await functions.crypto.decryptItem(props.live2d, session)
            let {width, height, size} = await functions.image.dimensions(decrypted)
            setDownloadText(`${width}x${height} (${functions.util.readableFileSize(size)})`)
        }
    }

    useEffect(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            getDLText()
        }, 200)
    }, [props.img, props.model, props.audio, props.live2d, props.comicPages, session])

    const getFavorite = async () => {
        if (!props.post || !session.username) return
        const favorite = await functions.http.get("/api/favorite", {postID: props.post.postID}, session, setSessionFlag)
        setFavorited(favorite ? true : false)
    }

    const getFavgroup = async () => {
        if (!props.post || !session.username) return
        const favgroups = await functions.http.get("/api/favgroups", {postID: props.post.postID}, session, setSessionFlag)
        setFavGrouped(favgroups?.length ? true : false)
    }

    useEffect(() => {
        getFavorite()
        getFavgroup()
    }, [props.post, session])

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
        if (noteMode) elementName = ".note-editor"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return 0
        const raw = bodyRect.bottom - rect.bottom
        let offset = -310
        if (mobile) offset += 20
        if (session.showR18) offset -= 35
        return raw + offset
    }

    const getFormatMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = formatRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -22
        if (format === "png") offset += 2
        if (format === "webp") offset += 8
        if (format === "avif") offset += 4
        if (format === "svg") offset += 1
        if (mobile) offset += 0
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
        if (mobile) offset += 95
        return `${raw + offset}px`
    }

    const updateFavorite = async (value: boolean) => {
        if (!props.post || !session.username) return
        await functions.http.post("/api/favorite/update", {postID: props.post.postID, favorited: value}, session, setSessionFlag)
        functions.post.updateLocalFavorite(props.post.postID, value, posts, setPosts)
        setFavorited(value)
    }

    const updateFavgroup = async () => {
        if (permissions.isPremium(session)) {
            setFavGroupID(props.post?.postID!)
        } else {
            setPremiumRequired(true)
        }
    }

    const closeDropdowns = () => {
        setShowFilterDropdown(false)
        setShowFormatDropdown(false)
    }

    const openFilterDropdown = () => {
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (permissions.isPremium(session)) {
            closeDropdowns()
            setShowFilterDropdown(true)
        } else {
            setPremiumRequired(true)
        }
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
                openFilterDropdown()
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
                    <PrevIcon className="post-image-icon-small"/>
                    {!session.username ? <div className="post-image-text-small">{i18n.post.prev}</div> : null}
                </div>
                {session.username ?
                <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} style={{marginLeft: "-10px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {favorited ? 
                    <StarIcon className="post-image-icon-pink"/> :
                    <StarIcon className="post-image-icon"/>}
                    <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? i18n.post.favorited : i18n.post.favorite}</div>
                </div> : null}
                {session.username ?
                <div className="post-image-options-box" onClick={() => updateFavgroup()}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {favGrouped ? 
                    <StarGroupIcon className="post-image-icon-pink"/> :
                    <StarGroupIcon className="post-image-icon"/>}
                    <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>{i18n.post.favgroup}</div>
                </div> : null}
                <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <NextIcon className="post-image-icon-small"/>
                    {!session.username ? <div className="post-image-text-small">{i18n.post.next}</div> : null}
                </div>
            </div>
            <div className="post-image-options">
                <div className="post-image-options-box" onClick={() => props.download?.()} style={{marginRight: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <DownloadIcon className="post-image-icon"/>
                    <div className="post-image-text">{i18n.buttons.download}</div>
                </div>
                {props.post?.type === "image" || props.post?.type === "comic" ? 
                <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                {String(format).toUpperCase()}</button> : null}
                <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} style={{marginLeft: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <FiltersIcon className="post-image-icon"/>
                    <div className="post-image-text">{i18n.filters.filters}</div>
                </div>
            </div> </>
             :
            <div className="post-image-options">
                <div className="post-image-options-left">
                    <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "15px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <PrevIcon className="post-image-icon-small"/>
                        <div className="post-image-text-small">{i18n.post.prev}</div>
                    </div>
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {favorited ? 
                        <StarIcon className="post-image-icon-pink"/> :
                        <StarIcon className="post-image-icon"/>}
                        <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? i18n.post.favorited : i18n.post.favorite}</div>
                    </div> : null}
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => updateFavgroup()} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {favGrouped ? 
                        <StarGroupIcon className="post-image-icon-pink"/> :
                        <StarGroupIcon className="post-image-icon"/>}
                        <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>{i18n.post.favgroup}</div>
                    </div> : null}
                </div>
                <div className="post-image-options-right">
                    <div className="post-image-options-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-alt">{downloadText}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.download?.()} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <DownloadIcon className="post-image-icon"/>
                        <div className="post-image-text">{i18n.buttons.download}</div>
                    </div>
                    {props.post?.type === "image" || props.post?.type === "comic" ? 
                    <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                    {String(format).toUpperCase()}</button> : null}
                    <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <FiltersIcon className="post-image-icon"/>
                        <div className="post-image-text">{i18n.filters.filters}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-small">{i18n.post.next}</div>
                        <NextIcon className="post-image-icon-small"/>
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