/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useThemeSelector, useSearchActions, useSearchSelector, 
useFlagActions, useInteractionActions, useCacheActions, useCacheSelector, useActiveActions,
useSessionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions} from "../../store"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"

import HashIcon from "../../assets/svg/hash.svg"
import InfoIcon from "../../assets/svg/info.svg"
import TagEditIcon from "../../assets/svg/tag.svg"
import SourceEditIcon from "../../assets/svg/search.svg"
import SetAvatarIcon from "../../assets/svg/setavatar.svg"
import ParentIcon from "../../assets/svg/parent.svg"
import GroupIcon from "../../assets/svg/add-group.svg"
import SnapshotIcon from "../../assets/svg/snapshot.svg"
import SplitIcon from "../../assets/svg/split.svg"
import JoinIcon from "../../assets/svg/join.svg"
import FlipIcon from "../../assets/svg/flip.svg"
import PrivateIcon from "../../assets/svg/private.svg"
import UnprivateIcon from "../../assets/svg/unprivate.svg"
import TakedownIcon from "../../assets/svg/takedown.svg"
import RestoreIcon from "../../assets/svg/restore.svg"
import EditIcon from "../../assets/svg/edit.svg"
import LockIcon from "../../assets/svg/lock.svg"
import UnlockIcon from "../../assets/svg/unlock.svg"
import HistoryIcon from "../../assets/svg/history.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import UndeleteIcon from "../../assets/svg/undelete.svg"
import RejectIcon from "../../assets/svg/reject.svg"
import ApproveIcon from "../../assets/svg/approve.svg"
import TagIcon from "../../assets/svg/tags.svg"
import CompressIcon from "../../assets/svg/compress.svg"
import UpscaleIcon from "../../assets/svg/waifu2x.svg"
import AppealIcon from "../../assets/svg/appeal.svg"

import website from "../../assets/icons/website.png"
import pixiv from "../../assets/icons/pixiv.png"
import twitter from "../../assets/icons/twitter.png"
import deviantart from "../../assets/icons/deviantart.png"
import artstation from "../../assets/icons/artstation.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import youtube from "../../assets/icons/youtube.png"
import bandcamp from "../../assets/icons/bandcamp.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import fandom from "../../assets/icons/fandom.png"
import wikipedia from "../../assets/icons/wikipedia.png"
import functions from "../../functions/Functions"
import path from "path"
import {PostSearch, PostHistory, UnverifiedPost, TagCount, TagGroupCategory, PrunedUser} from "../../types/Types"
import "./styles/mobileinfo.less"

interface Props {
    post?: PostSearch | PostHistory | UnverifiedPost
    artists?: TagCount[] 
    characters?: TagCount[]  
    series?: TagCount[]
    meta?: TagCount[]
    tags?: TagCount[]
    tagGroups?: TagGroupCategory[]
    unverified?: boolean
    order?: number
}

const MobileInfo: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {noteMode} = useSearchSelector()
    const {setSearchFlag, setNoteMode, setNoteDrawingEnabled} = useSearchActions()
    const {posts, unverifiedPosts, tags} = useCacheSelector()
    const {setTags} = useCacheActions()
    const {setEnableDrag} = useInteractionActions()
    const {setRandomFlag, setImageSearchFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setTagEditID, setSourceEditID, setPrivatePostID, setLockPostID, setUpscalePostID, setCompressPostID, 
    setDeletePostID, setTakedownPostID, setChildPostObj, setUndeletePostID, setAppealPostID, setPostInfoID,
    setSplitPostID, setJoinPostID, setFlipPostID, setEditThumbnailID, setAvatarID} = usePostDialogActions()
    const {setActionBanner} = useActiveActions()
    const {setGroupPostID} = useGroupDialogActions()
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderImagePost, setUploaderImagePost] = useState("")
    const [uploaderData, setUploaderData] = useState(null as PrunedUser | null)
    const [updaterData, setUpdaterData] = useState(null as PrunedUser | null)
    const [approverData, setApproverData] = useState(null as PrunedUser | null)
    const navigate = useNavigate()
    const location = useLocation()

    const updateTags = async () => {
        const tags = await functions.tag.parseTags(posts, session, setSessionFlag)
        setTags(tags)
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await functions.http.get("/api/user", {username: props.post.uploader}, session, setSessionFlag, true)
            setUploaderImage(uploader?.image ? functions.link.getFolderLink("pfp", uploader.image, uploader.imageHash) : favicon)
            setUploaderImagePost(uploader?.imagePost || "")
            setUploaderData(uploader ?? null)
            const updater = await functions.http.get("/api/user", {username: props.post.updater}, session, setSessionFlag, true)
            setUpdaterData(updater ?? null)
            const approver = await functions.http.get("/api/user", {username: props.post.approver}, session, setSessionFlag, true)
            setApproverData(approver ?? null)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()
    }, [session])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    const generateArtistsJSX = () => {
        if (!props.artists) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.artists.length; i++) {
            const link = functions.link.getTagLink(props.artists[i])
            if (!props.artists[i]) break
            const tagClick = () => {
                if (!props.artists) return
                navigate(`/tag/${encodeURIComponent(props.artists[i].tag)}`)
            }
            const artistSocials = () => {
                if (!props.artists) return
                let jsx = [] as React.ReactElement[]
                const tag = props.artists[i]
                if (!tag) return jsx
                if (tag.website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(tag.website!, "_blank")}/>)
                }
                if (tag.social?.includes("pixiv.net")) {
                    jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(tag.social!, "_blank")}/>)
                } else if (tag.social?.includes("soundcloud.com")) {
                    jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(tag.social!, "_blank")}/>)
                } else if (tag.social?.includes("sketchfab.com")) {
                    jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(tag.social!, "_blank")}/>)
                }
                if (tag.twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                    {link ?
                    <div className="mobileinfo-row">
                        <img className="mobileinfo-img" src={link}/>
                    </div> : null}
                    <div className="mobileinfo-row">
                        <span className="tag-hover">
                            <span className="tag artist-tag-color" onClick={() => tagClick()}>{props.artists[i].tag?.replaceAll("-", " ")}</span>
                            {artistSocials()}
                            <span className={`tag-count ${props.artists[i].count === "1" ? "artist-tag-color" : ""}`}>{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        if (!props.characters) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.characters.length; i++) {
            const link = functions.link.getTagLink(props.characters[i])
            if (!props.characters[i]) break
            const tagClick = () => {
                if (!props.characters) return
                navigate(`/tag/${encodeURIComponent(props.characters[i].tag)}`)
            }
            const characterSocials = () => {
                if (!props.characters) return
                let jsx = [] as React.ReactElement[] 
                const tag = props.characters[i]
                if (!tag) return jsx
                if (tag.fandom) {
                    jsx.push(<img className="sidebar-social" src={fandom} onClick={() => window.open(tag.fandom!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag character-tag-color" onClick={() => tagClick()}>{props.characters[i].tag?.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className={`tag-count ${props.characters[i].count === "1" ? "artist-tag-color" : ""}`}>{props.characters[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        if (!props.series) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.series.length; i++) {
            const link = functions.link.getTagLink(props.series[i])
            if (!props.series[i]) break
            const tagClick = () => {
                if (!props.series) return
                navigate(`/tag/${encodeURIComponent(props.series[i].tag)}`)
            }
            const seriesSocials = () => {
                if (!props.series) return
                let jsx = [] as React.ReactElement[]
                const tag = props.series[i]
                if (!tag) return jsx
                if (tag.website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(tag.website!, "_blank")}/>)
                }
                if (tag.twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(tag.twitter!, "_blank")}/>)
                }
                if (tag.wikipedia) {
                    jsx.push(<img className="sidebar-social" src={wikipedia} onClick={() => window.open(tag.wikipedia!, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="mobileinfo-row">
                    <img className="mobileinfo-img" src={link}/>
                </div> : null}
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag series-tag-color" onClick={() => tagClick()}>{props.series[i].tag?.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className={`tag-count ${props.series[i].count === "1" ? "artist-tag-color" : ""}`}>{props.series[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateMetaJSX = () => {
        if (!props.meta) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < props.meta.length; i++) {
            if (!props.meta[i]) break
            const tagClick = () => {
                if (!props.meta) return
                navigate(`/tag/${encodeURIComponent(props.meta[i].tag)}`)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover">
                        <span className="tag meta-tag-color" onClick={() => tagClick()}>{props.meta[i].tag?.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${props.meta[i].count === "1" ? "artist-tag-color" : ""}`}>{props.meta[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const organizeTags = (tags: TagCount[]) => {
        if (!tags?.length) return [] as TagCount[]
        const meta = tags.filter((t) => t.type === "meta")
        const appearance = tags.filter((t) => t.type === "appearance")
        const outfit = tags.filter((t) => t.type === "outfit")
        const accessory = tags.filter((t) => t.type === "accessory")
        const action = tags.filter((t) => t.type === "action")
        const scenery = tags.filter((t) => t.type === "scenery")
        const other = tags.filter((t) => t.type === "tag")
        return [...meta, ...appearance, ...outfit, ...accessory, ...action, ...scenery, ...other.reverse()]
    }

    const generateTagGroupJSX = () => {
        if (!props.tagGroups) return null
        let jsx = [] as React.ReactElement[]
        let tagGroups = functions.tag.appendOrphanTags(props.tagGroups, props.tags)
        tagGroups = [...tagGroups].sort((a, b) => {
            return a.name.toLowerCase() === "tags" ? 1 :
                b.name.toLowerCase() === "tags" ? -1 : 0
        })
        for (const tagGroup of tagGroups) {
            let currentTags = organizeTags(tagGroup.tags)
            if (!currentTags.length) continue
            jsx.push(
                <div key={`tagGroup-${tagGroup.name}`} className="mobileinfo-title-container">
                    <span className="mobileinfo-title">{functions.util.toProperCase(tagGroup.name.replaceAll("-", " "))}</span>
                </div>
            )
            for (let i = 0; i < currentTags.length; i++) {
                if (!currentTags[i]) break
                const tagClick = () => {
                    navigate(`/tag/${encodeURIComponent(currentTags[i].tag)}`)
                }
                jsx.push(
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={() => tagClick()}>
                            <span className={`tag ${functions.tag.getTagColor(currentTags[i])}`}>{currentTags[i].tag?.replaceAll("-", " ")}</span>
                            <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                        </span>
                    </div>
                )
            }
        }
        return jsx
    }

    const generateTagJSX = () => {
        if (props.tagGroups?.length) return generateTagGroupJSX()
        let jsx = [] as React.ReactElement[]
        let currentTags = props.tags ? organizeTags([...(props.meta || []), ...props.tags]) : tags
        let max = props.tags ? currentTags.length : Math.min(currentTags.length, 100)
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                navigate(`/tag/${encodeURIComponent(currentTags[i].tag)}`)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className={`tag ${functions.tag.getTagColor(currentTags[i])}`}>{currentTags[i].tag?.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const copyTags = async (event: React.MouseEvent) => {
        if (!props.artists || !props.characters || !props.series || !props.tags) return
        event.preventDefault()
        const artists = props.artists.map((a) => a.tag)
        const characters = props.characters.map((c) => c.tag)
        const series = props.series.map((s) => s.tag)
        const tags = props.tags.map((t) => t.tag)
        let combined = [...artists, ...characters, ...series, ...tags]
        let commas = false
        let replaceDash = false 
        let danbooru = false
        if (event.shiftKey) {
            commas = false
            replaceDash = true
            danbooru = true
        } else if (event.button === 2) {
            commas = true
            replaceDash = true
        }
        let outTags = ""
        if (danbooru) {
            if (combined.includes("solo")) combined.push("1girl")
            outTags = await functions.http.post("/api/misc/danboorutags", 
            {tags: combined.join(" ")}, session, setSessionFlag).then((r) => r.tags)
        } else {
            if (replaceDash) combined = combined.map((c: string) => c.replaceAll("-", " "))
            outTags = commas ? combined.join(", ") : combined.join(" ")
        }
        navigator.clipboard.writeText(outTags)
        setActionBanner("copy-tags")
    }

    const copyHash = (pixelHash?: boolean) => {
        if (!props.post || !props.order) return
        const image = props.post.images[props.order-1]
        if (typeof image === "string") return
        navigator.clipboard.writeText(pixelHash ? image.pixelHash : image.hash)
        setActionBanner("copy-hash")
    }

    const triggerSearch = () => {
        navigate(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = () => {
        navigate(`/posts`)
        setRandomFlag(true)
    }

    const imageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.image.imageSearch(file, session, setSessionFlag)
        setImageSearchFlag(result)
        navigate("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        if (!props.post) return
        setDeletePostID({post: props.post, unverified: props.unverified})
    }

    const undeletePost = async () => {
        if (!props.post) return
        setUndeletePostID({postID: props.post.postID, unverified: props.unverified})
    }

    const appealPost = async () => {
        if (!props.post) return
        setAppealPostID(props.post.postID)
    }

    const editPost = async () => {
        if (!props.post) return
        if (props.unverified) return navigate(`/unverified/edit-post/${props.post.postID}`)
        navigate(`/edit-post/${props.post.postID}/${props.post.slug}`)
    }

    const privatePost = async () => {
        if (!props.post || !props.artists) return
        setPrivatePostID({post: props.post, artists: props.artists})
    }

    const lockPost = async () => {
        if (!props.post) return
        setLockPostID({post: props.post, unverified: props.unverified})
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p) => p.postID === props.post?.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                navigate(`/unverified/post/${id}`)
            }
        }
        navigate(`/mod-queue`)
    }

    const upscalingDialog = () => {
        if (!props.post) return
        setUpscalePostID({post: props.post, unverified: props.unverified})
    }

    const compressingDialog = () => {
        if (!props.post) return
        setCompressPostID({post: props.post, unverified: props.unverified})
    }

    const approvePost = async () => {
        if (!props.post) return
        await functions.http.post("/api/post/approve", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const rejectPost = async () => {
        if (!props.post) return
        await functions.http.post("/api/post/reject", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const triggerSetAvatar = () => {
        if (!props.post) return
        setAvatarID({post: props.post, order: props.order || 1, unverified: props.unverified})
    }

    const triggerTagEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.meta || !props.tags) return
        setTagEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            meta: props.meta, tags: props.tags, tagGroups: props.tagGroups,
            unverified: props.unverified, order: props.order || 1})
    }

    const triggerSourceEdit = () => {
        if (!props.post || !props.artists || !props.characters || !props.series || !props.meta || !props.tags || !props.order) return
        setSourceEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            meta: props.meta, tags: props.tags, tagGroups: props.tagGroups,
            unverified: props.unverified, order: props.order || 1})
    }

    const getSource = () => {
        if (!props.post) return ""
        let order = (props.order || 1) - 1
        if ("historyID" in props.post) {
            let src = props.post.imageSources?.[String(order)]
            if (src) return src
        } else {
            let image = props.post.images[order]
            if (image?.altSource) return image.altSource
        }
        return props.post.source
    }

    const generateSourceJSX = () => {
        if (!props.post) return
        let jsx = [] as React.ReactElement[]
        let source = getSource()
        if (source) {
            if (source.includes("pixiv")) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("twitter") || source.includes("x.com")) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("deviantart")) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("artstation")) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("youtube")) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("soundcloud")) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("bandcamp")) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(source, "_blank")}/>)
            }
            if (source.includes("sketchfab")) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(source, "_blank")}/>)
            }
        }
        return (
            <div className="mobileinfo-row">
                <span className="side-info">{i18n.labels.source}:</span>
                <span className={`side-info-alt-link ${props.post.hidden ? "strikethrough" : ""}`} onClick={() => window.open(source, "_blank")}>{functions.util.getSiteName(source, i18n)}</span>
                {jsx}
            </div>
        )
    }

    const generateMirrorsJSX = () => {
        if (!props.post) return
        let jsx = [] as React.ReactElement[]
        if (props.post.mirrors) {
            if (props.post.mirrors.pixiv) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post?.mirrors?.pixiv, "_blank")}/>)
            }
            if (props.post.mirrors.twitter) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.post?.mirrors?.twitter, "_blank")}/>)
            }
            if (props.post.mirrors.deviantart) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(props.post?.mirrors?.deviantart, "_blank")}/>)
            }
            if (props.post.mirrors.artstation) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(props.post?.mirrors?.artstation, "_blank")}/>)
            }
            if (props.post.mirrors.youtube) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post?.mirrors?.youtube, "_blank")}/>)
            }
            if (props.post.mirrors.soundcloud) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.post?.mirrors?.soundcloud, "_blank")}/>)
            }
            if (props.post.mirrors.bandcamp) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post?.mirrors?.bandcamp, "_blank")}/>)
            }
            if (props.post.mirrors.sketchfab) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.post?.mirrors?.sketchfab, "_blank")}/>)
            }
        }
        if (jsx.length) {
            return (
                <div className="mobileinfo-row">
                    <span className="side-info">{i18n.labels.mirrors}:</span>
                    {jsx}
                </div>
            )
        }
        return null
    }

    const triggerParent = () => {
        if (!props.post) return
        setChildPostObj({post: props.post, unverified: props.unverified})
    }

    const triggerGroup = () => {
        if (!props.post) return
        setGroupPostID(props.post.postID)
    }

    const triggerTakedown = () => {
        if (!props.post) return
        setTakedownPostID({post: props.post, unverified: props.unverified})
    }

    const getPostInfo = async () => {
        if (!props.post) return
        setPostInfoID({post: props.post, order: props.order || 1})
    }

    const editThumbnail = async () => {
        if (!props.post) return
        setEditThumbnailID({post: props.post, order: props.order || 1, unverified: props.unverified})
    }

    const triggerSplit = async () => {
        if (!permissions.isAdmin(session) || !props.post) return
        setSplitPostID({post: props.post, order: props.order || 1})
    }

    const triggerJoin = async () => {
        if (!permissions.isAdmin(session) || !props.post) return
        setJoinPostID({post: props.post, unverified: props.unverified})
    }

    const triggerFlip = async () => {
        if (!permissions.isAdmin(session) || !props.post) return
        setFlipPostID({post: props.post, unverified: props.unverified})
    }

    const postHistory = () => {
        if (!props.post) return
        window.scrollTo(0, 0)
        navigate(`/post/history/${props.post.postID}/${props.post.slug}`)
    }

    const generateUsernameJSX = (type?: string) => {
        if (!uploaderData) return
        let user = uploaderData
        if (type === "updater" && updaterData) user = updaterData
        if (type === "approver" && approverData) user = approverData
        return functions.jsx.usernameJSX(user, {
            containerClass: "mobileinfo-username-container",
            textClass: "side-info-alt pointer-cursor",
            imageClass: "mobileinfo-user-label"
        }, i18n, navigate)
    }

    const copyTagsJSX = () => {
        if (!session) return
        if (session.captchaNeeded) return null
        if (props.artists && props.characters && props.series && props.tags) {
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={copyTags} onContextMenu={copyTags}>
                            <TagIcon className="mobileinfo-icon"/>
                            <span className="tag-red">{i18n.sidebar.copyTags}</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const tagCaptchaJSX = () => {
        if (!session) return
        if (session.captchaNeeded) {
            if (!location.pathname.includes("/post/") && !location.pathname.includes("/edit-post")) return
            const toggleCaptcha = () => {
                sessionStorage.setItem("ignoreCaptcha", "false")
                history.go(0)
            }
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={toggleCaptcha}>
                            <TagIcon className="mobileinfo-icon"/>
                            <span className="tag-red">{i18n.sidebar.unlockPost}</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const filetypeJSX = () => {
        if (props.post && props.unverified) {
            const image = (props.post as UnverifiedPost).images[(props.order || 1) - 1]
            const originalSize = image.size ? functions.util.readableFileSize(image.size) : ""
            const upscaledSize = image.upscaledSize ? functions.util.readableFileSize(image.upscaledSize) : ""
            const originalExt = path.extname(image?.filename || "").replace(".", "")
            const upscaledExt = path.extname(image?.upscaledFilename || "").replace(".", "")
            return (
                <div className="mobileinfo-subcontainer">
                    {originalSize ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.size}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalSize}</span>
                    </div> : null}
                    {originalExt ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.fileType}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{originalExt}</span>
                    </div> : null}
                    {upscaledSize ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.upscaledSize}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{upscaledSize}</span>
                    </div> : null}
                    {upscaledExt ? 
                    <div className="mobileinfo-row">
                        <span className="tag artist-tag-color">{i18n.labels.upscaledFileType}: </span>
                        <span style={{marginLeft: "7px"}} className="tag artist-tag-color">{upscaledExt}</span>
                    </div> : null}
                </div>
            )
        }
    }

    const noTagsArtist = () => {
        if (!props.post || !session) return
        if (session.captchaNeeded) {
            return (
            <div className="mobileinfo-row">
                <span className="tag">{i18n.tag.artist}:</span>
                <span className="tag-alt">{props.post.artist || "None"}</span>
            </div>
            )
        }
    }

    const openPost = async (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    return (
        <div className="mobileinfo" onMouseEnter={() => setEnableDrag(false)}>
            <div className="mobileinfo-container">
            <div className="mobileinfo-content">

                {copyTagsJSX()}
                {tagCaptchaJSX()}
                {filetypeJSX()}

                {props.post && props.artists ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.artists.length > 1 ? i18n.navbar.artists : i18n.tag.artist}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateArtistsJSX()}
                        {noTagsArtist()}
                        <div className="mobileinfo-row">
                            <span className="side-info">{i18n.labels.title}:</span>
                            <span className={`side-info-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.title || "None"}</span>
                        </div>
                        {props.post.englishTitle ? 
                        <div className="mobileinfo-row">
                            <span className="side-info">{i18n.sidebar.english}:</span>
                            <span className={`side-info-alt ${props.post.hidden ? "strikethrough" : ""}`}>{functions.util.toProperCase(props.post.englishTitle)}</span>
                        </div>
                        : null}
                        <div className="mobileinfo-row">
                            <span className="side-info">{i18n.tag.artist}:</span>
                            <span className={`side-info-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.artist || "?"}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="side-info">{i18n.sort.posted}:</span>
                            <span className={`side-info-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.posted ? functions.date.formatDate(new Date(props.post.posted)) : "Unknown"}</span>
                        </div>
                        {generateSourceJSX()}
                        <div className="mobileinfo-row">
                            <span className="side-info">{i18n.sort.bookmarks}:</span>
                            <span className={`side-info-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.bookmarks ? props.post.bookmarks : "?"}</span>
                        </div>
                        {generateMirrorsJSX()}
                    </div> </>
                : null}

                {props.characters ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.characters.length > 1 ? i18n.navbar.characters : i18n.tag.character}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateCharactersJSX()}
                    </div> </>
                : null}

                {props.series ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">{i18n.tag.series}</span>
                        </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateSeriesJSX()}
                    </div> </>
                : null}

                {props.tags ? <>
                     {!props.tagGroups?.length ? <div className="mobileinfo-title-container">
                             <span className="mobileinfo-title">{i18n.navbar.tags}</span>
                    </div> : null}
                     <div className="mobileinfo-subcontainer">
                         {generateTagJSX()}
                     </div> </>
                : null}

                {props.tagGroups?.length && props.meta ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">{i18n.tag.meta}</span>
                        </div>
                    <div className="mobileinfo-subcontainer">
                        {generateMetaJSX()}
                    </div> </>
                : null}

                {props.post ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{i18n.sidebar.details}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                                <img className="mobileinfo-img" src={uploaderImage} onClick={(event) => openPost(uploaderImagePost, event)}/>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.uploader}:</span>
                                {generateUsernameJSX("uploader")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.uploaded}:</span>
                                <span className="side-info-alt">{functions.date.formatDate(new Date(props.post.uploadDate))}</span>
                            </div>
                        </div>
                        {props.post.uploadDate !== props.post.updatedDate ? 
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.updater}:</span>
                                {generateUsernameJSX("updater")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.updated}:</span>
                                <span className="side-info-alt">{functions.date.formatDate(new Date(props.post.updatedDate))}</span>
                            </div>
                        </div> : null}
                        {props.post.uploader !== props.post.approver ?
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.approver}:</span>
                                {generateUsernameJSX("approver")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.approved}:</span>
                                <span className="side-info-alt">{functions.date.formatDate(new Date(props.post.approveDate))}</span>
                            </div>
                        </div> : null}
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.type}:</span>
                                <span className="side-info-alt">{i18n.sortbar.type[props.post.type]}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.rating}:</span>
                                <span className="side-info-alt">{i18n.sortbar.rating[props.post.rating]}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sidebar.style}:</span>
                                <span className="side-info-alt">{i18n.sortbar.style[props.post.style]}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sort.favorites}:</span>
                                <span className="side-info-alt">{(props.post as PostSearch).favoriteCount || 0}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="side-info">{i18n.sort.cuteness}:</span>
                                <span className="side-info-alt">{(props.post as PostSearch).cuteness || 500}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={() => copyHash()} onAuxClick={() => copyHash()} onContextMenu={(event) => {event.preventDefault(); setTimeout(() => copyHash(true), 100)}}>
                                    <HashIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.copyHash}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={getPostInfo}>
                                    <InfoIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.getInfo}</span>
                                </span>
                            </div>
                            {!props.unverified && !functions.post.isR18(props.post.rating) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSetAvatar}>
                                    <SetAvatarIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.setAvatar}</span>
                                </span>
                            </div> : null}
                        </div>
                    </div></>
                : null}

                {props.post && session.username ? 
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerTagEdit}>
                                    <TagEditIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.tagEdit}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSourceEdit}>
                                    <SourceEditIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.sourceEdit}</span>
                                </span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerParent}>
                                    <ParentIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.addParent}</span>
                                </span>
                            </div> : null}
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerGroup}>
                                    <GroupIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.addGroup}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified && permissions.isAdmin(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerSplit}>
                                    <SplitIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.splitVariations}</span>
                                </span>
                            </div> : null}
                            {!props.unverified && permissions.isAdmin(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerJoin}>
                                    <JoinIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.joinChildPosts}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified && props.post.parentID && permissions.isAdmin(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerFlip}>
                                    <FlipIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.flipParent}</span>
                                </span>
                            </div> : null}
                            {permissions.isMod(session) ? 
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={editThumbnail}>
                                    <SnapshotIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.sidebar.editThumbnail}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {!props.unverified && permissions.canPrivate(session, props.artists) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={privatePost}>
                                    {props.post.private ?
                                    <UnprivateIcon className="mobileinfo-icon"/> :
                                    <PrivateIcon className="mobileinfo-icon"/>}
                                    <span className="side-info">{props.post.private ? i18n.sidebar.unprivate : i18n.sort.private}</span>
                                </span>
                            </div> : null}
                            {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={triggerTakedown}>
                                    {props.post.hidden ?
                                    <RestoreIcon className="mobileinfo-icon"/> :
                                    <TakedownIcon className="mobileinfo-icon"/>}
                                    <span className="side-info">{props.post.hidden ? i18n.sidebar.restore : i18n.sidebar.takedown}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified ? <>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={compressingDialog}>
                                    <CompressIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.buttons.compress}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={upscalingDialog}>
                                    <UpscaleIcon className="mobileinfo-icon"/>
                                    <span className="side-info">{i18n.buttons.upscale}</span>
                                </span>
                            </div></> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified ? <>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={approvePost}>
                                    <ApproveIcon className="mobileinfo-icon-green"/>
                                    <span className="side-info-green">{i18n.buttons.approve}</span>
                                </span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={rejectPost}>
                                    <RejectIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.buttons.reject}</span>
                                </span>
                            </div>
                            </> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={editPost}>
                                    <EditIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.buttons.edit}</span>
                                </span>
                            </div>
                            {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={lockPost}>
                                    {props.post.locked ?
                                    <UnlockIcon className="mobileinfo-icon-red"/> :
                                    <LockIcon className="mobileinfo-icon-red"/>}
                                    <span className="side-info-red">{props.post.locked ? i18n.sidebar.unlock : i18n.sidebar.lock}</span>
                                </span>
                            </div> : null}
                            {!props.unverified ? <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={postHistory}>
                                    <HistoryIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.sidebar.history}</span>
                                </span>
                            </div> : null}
                            {!(permissions.isMod(session) && props.unverified) || props.post.deleted ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={deletePost}>
                                    <DeleteIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.buttons.delete}</span>
                                </span>
                            </div> : null}
                            {permissions.isMod(session) && props.post.deleted ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={undeletePost}>
                                    <UndeleteIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.buttons.undelete}</span>
                                </span>
                            </div> : null}
                        </div>
                        <div className="mobileinfo-sub-row">
                            {props.unverified && props.post.deleted && !(props.post as UnverifiedPost).appealed ?
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={appealPost}>
                                    <AppealIcon className="mobileinfo-icon-red"/>
                                    <span className="side-info-red">{i18n.buttons.appeal}</span>
                                </span>
                            </div> : null}
                        </div>
                    </div>
                : null}
            </div>
        </div> 
        </div>
    )
}

export default MobileInfo