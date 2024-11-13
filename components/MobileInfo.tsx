import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSearchActions, useSearchSelector, 
useFlagActions, useInteractionActions, useCacheActions, useCacheSelector, useActiveActions,
useSessionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions,
usePostDialogSelector} from "../store"
import permissions from "../structures/Permissions"
import favicon from "../assets/icons/favicon.png"
import setAvatar from "../assets/icons/setavatar.png"
import addTranslation from "../assets/icons/translation-toggle-on.png"
import report from "../assets/icons/report.png"
import edit from "../assets/icons/edit.png"
import historyIcon from "../assets/icons/history.png"
import tagEdit from "../assets/icons/tag-outline.png"
import sourceEdit from "../assets/icons/history-search.png"
import deleteIcon from "../assets/icons/delete.png"
import takedown from "../assets/icons/takedown.png"
import restore from "../assets/icons/restore.png"
import rejectRed from "../assets/icons/reject-red.png"
import approveGreen from "../assets/icons/approve-green.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import tagIcon from "../assets/icons/tag.png"
import hashIcon from "../assets/icons/hash.png"
import website from "../assets/icons/support.png"
import pixiv from "../assets/icons/pixiv.png"
import twitter from "../assets/icons/twitter.png"
import deviantart from "../assets/icons/deviantart.png"
import artstation from "../assets/icons/artstation.png"
import soundcloud from "../assets/icons/soundcloud.png"
import youtube from "../assets/icons/youtube.png"
import bandcamp from "../assets/icons/bandcamp.png"
import sketchfab from "../assets/icons/sketchfab.png"
import fandom from "../assets/icons/fandom.png"
import danbooru from "../assets/icons/danbooru.png"
import gelbooru from "../assets/icons/gelbooru.png"
import safebooru from "../assets/icons/safebooru.png"
import yandere from "../assets/icons/yandere.png"
import konachan from "../assets/icons/konachan.png"
import zerochan from "../assets/icons/zerochan.png"
import group from "../assets/icons/group.png"
import compressIcon from "../assets/icons/compress.png"
import upscaleIcon from "../assets/icons/waifu2x.png"
import lockIcon from "../assets/icons/lock-red.png"
import unlockIcon from "../assets/icons/unlock-red.png"
import privateIcon from "../assets/icons/private.png"
import unprivateIcon from "../assets/icons/unprivate.png"
import functions from "../structures/Functions"
import "./styles/mobileinfo.less"

interface Props {
    post?: any
    artists?: any 
    characters?: any 
    series?: any
    tags?: any
    unverified?: boolean
    order?: number
}

const MobileInfo: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {translationMode} = useSearchSelector()
    const {setSearchFlag, setTranslationMode, setTranslationDrawingEnabled} = useSearchActions()
    const {posts, unverifiedPosts, tags} = useCacheSelector()
    const {setTags} = useCacheActions()
    const {setEnableDrag} = useInteractionActions()
    const {setRandomFlag, setImageSearchFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {showUpscalingDialog, showCompressingDialog, showDeletePostDialog, showTakedownPostDialog} = usePostDialogSelector()
    const {setTagEditID, setSourceEditID, setPrivatePostObj, setLockPostID, setShowUpscalingDialog, setShowCompressingDialog, setShowDeletePostDialog, setShowTakedownPostDialog} = usePostDialogActions()
    const {setActionBanner} = useActiveActions()
    const {setGroupPostID} = useGroupDialogActions()
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [approverRole, setApproverRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const tags = await functions.parseTags(posts, session, setSessionFlag)
        setTags(tags)
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await functions.get("/api/user", {username: props.post.uploader}, session, setSessionFlag)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image, uploader.imageHash) : favicon)
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await functions.get("/api/user", {username: props.post.updater}, session, setSessionFlag)
            if (updater?.role) setUpdaterRole(updater.role)
            const approver = await functions.get("/api/user", {username: props.post.approver}, session, setSessionFlag)
            if (approver?.role) setApproverRole(approver.role)
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
        let jsx = [] as any
        for (let i = 0; i < props.artists.length; i++) {
            const link = functions.getTagLink("artist", props.artists[i].image, props.artists[i].imageHash)
            if (!props.artists[i]) break
            const tagClick = () => {
                history.push(`/tag/${props.artists[i].tag}`)
            }
            const artistSocials = () => {
                let jsx = [] as any 
                if (props.artists[i].website) {
                    jsx.push(<img className="mobileinfo-social" src={website} onClick={() => window.open(props.artists[i].website, "_blank")}/>)
                }
                if (props.artists[i].social?.includes("pixiv.net")) {
                    jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.artists[i].social, "_blank")}/>)
                } else if (props.artists[i].social?.includes("soundcloud.com")) {
                    jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.artists[i].social, "_blank")}/>)
                } else if (props.artists[i].social?.includes("sketchfab.com")) {
                    jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.artists[i].social, "_blank")}/>)
                }
                if (props.artists[i].twitter) {
                    jsx.push(<img className="mobileinfo-social" src={twitter} onClick={() => window.open(props.artists[i].twitter, "_blank")}/>)
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
                            <span className="tag artist-tag-color" onClick={() => tagClick()}>{props.artists[i].tag.replaceAll("-", " ")}</span>
                            {artistSocials()}
                            <span className={`tag-count ${props.artists[i].count === "1" ? "artist-tag-color" : ""}`}>{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.characters.length; i++) {
            const link = functions.getTagLink("character", props.characters[i].image, props.characters[i].imageHash)
            if (!props.characters[i]) break
            const tagClick = () => {
                history.push(`/tag/${props.characters[i].tag}`)
            }
            const characterSocials = () => {
                let jsx = [] as any 
                if (props.characters[i].fandom) {
                    jsx.push(<img className="mobileinfo-social" src={fandom} onClick={() => window.open(props.characters[i].fandom, "_blank")}/>)
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
                        <span className="tag character-tag-color" onClick={() => tagClick()}>{props.characters[i].tag.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className={`tag-count ${props.characters[i].count === "1" ? "artist-tag-color" : ""}`}>{props.characters[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.series.length; i++) {
            const link = functions.getTagLink("series", props.series[i].image, props.series[i].imageHash)
            if (!props.series[i]) break
            const tagClick = () => {
                history.push(`/tag/${props.series[i].tag}`)
            }
            const seriesSocials = () => {
                let jsx = [] as any 
                if (props.series[i].website) {
                    jsx.push(<img className="mobileinfo-social" src={website} onClick={() => window.open(props.series[i].website, "_blank")}/>)
                }
                if (props.series[i].twitter) {
                    jsx.push(<img className="mobileinfo-social" src={twitter} onClick={() => window.open(props.series[i].twitter, "_blank")}/>)
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
                        <span className="tag series-tag-color" onClick={() => tagClick()}>{props.series[i].tag.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className={`tag-count ${props.series[i].count === "1" ? "artist-tag-color" : ""}`}>{props.series[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const organizeTags = () => {
        const meta = props.tags.filter((t: any) => t.type === "meta")
        const appearance = props.tags.filter((t: any) => t.type === "appearance")
        const outfit = props.tags.filter((t: any) => t.type === "outfit")
        const accessory = props.tags.filter((t: any) => t.type === "accessory")
        const action = props.tags.filter((t: any) => t.type === "action")
        const scenery = props.tags.filter((t: any) => t.type === "scenery")
        const tags = props.tags.filter((t: any) => t.type === "tag")
        return [...meta, ...appearance, ...outfit, ...accessory, ...action, ...scenery, ...tags.reverse()]
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let currentTags = props.tags ? organizeTags() : tags
        let max = currentTags.length > maxTags ? maxTags : currentTags.length
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                history.push(`/tag/${currentTags[i].tag}`)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className={`tag ${functions.getTagColor(currentTags[i])}`}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className={`tag-count ${currentTags[i].count === "1" ? "artist-tag-color" : ""}`}>{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
    }

    const copyTags = (replaceDash?: boolean, commas?: boolean) => {
        const artists = props.artists.map((a: any) => a.tag)
        const characters = props.characters.map((c: any) => c.tag)
        const series = props.series.map((s: any) => s.tag)
        const tags = props.tags.map((t: any) => t.tag)
        let combined = [...artists, ...characters, ...series, ...tags]
        if (replaceDash) combined = combined.map((c: string) => c.replaceAll("-", " "))
        navigator.clipboard.writeText(commas ? combined.join(", ") : combined.join(" "))
        setActionBanner("copy-tags")
    }

    const copyHash = () => {
        if (!props.order) return
        const hash = props.post.images[props.order-1]?.hash
        navigator.clipboard.writeText(hash)
        setActionBanner("copy-hash")
    }

    const getDomain = () => {
        if (props.post.link) {
            const domain = new URL(props.post.link).hostname.replace("www.", "")
            .split(".")?.[0] || ""
            if (domain.toLowerCase() === "yande") return "Yandere"
            return functions.toProperCase(domain)
        }
        return "Unknown"
    }

    const triggerSearch = () => {
        history.push(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = () => {
        history.push(`/posts`)
        setRandomFlag(true)
    }

    const imageSearch = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const result = await functions.imageSearch(file, session, setSessionFlag)
        setImageSearchFlag(result)
        history.push("/posts")
        event.target.value = ""
    }

    const deletePost = async () => {
        setShowDeletePostDialog(!showDeletePostDialog)
    }

    const editPost = async () => {
        if (props.unverified) return history.push(`/unverified/edit-post/${props.post.postID}`)
        history.push(`/edit-post/${props.post.postID}`)
    }

    const privatePost = async () => {
        setPrivatePostObj({postID: props.post.postID, artists: props.artists})
    }

    const lockPost = async () => {
        setLockPostID(props.post.postID)
    }

    const modNext = () => {
        let currentIndex = unverifiedPosts.findIndex((p: any) => p.postID === props.post.postID)
        if (currentIndex !== -1) {
            currentIndex++
            if (unverifiedPosts[currentIndex]) {
                const id = unverifiedPosts[currentIndex].postID
                history.push(`/unverified/post/${id}`)
            }
        }
        history.push(`/mod-queue`)
    }

    const upscalingDialog = () => {
        setShowUpscalingDialog(!showUpscalingDialog)
    }

    const compressingDialog = () => {
        setShowCompressingDialog(!showCompressingDialog)
    }

    const approvePost = async () => {
        await functions.post("/api/post/approve", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const rejectPost = async () => {
        await functions.post("/api/post/reject", {postID: props.post.postID}, session, setSessionFlag)
        modNext()
    }

    const triggerSetAvatar = () => {
        window.scrollTo(0, 0)
        history.push(`/set-avatar/${props.post.postID}`)
    }

    const triggerTagEdit = () => {
        setTagEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            tags: props.tags, unverified: props.unverified})
    }

    const triggerSourceEdit = () => {
        setSourceEditID({post: props.post, unverified: props.unverified})
    }

    const generateSourceJSX = () => {
        let jsx = [] as any
        if (props.post.link) {
            if (props.post.link.includes("pixiv")) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("soundcloud")) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("sketchfab")) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("twitter") || props.post.link.includes("x.com")) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("deviantart")) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("artstation")) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("danbooru")) {
                jsx.push(<img className="sidebar-social" src={danbooru} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("gelbooru")) {
                jsx.push(<img className="sidebar-social" src={gelbooru} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("safebooru")) {
                jsx.push(<img className="sidebar-social" src={safebooru} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("yande.re")) {
                jsx.push(<img className="sidebar-social" src={yandere} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("konachan")) {
                jsx.push(<img className="sidebar-social" src={konachan} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("zerochan")) {
                jsx.push(<img className="sidebar-social" src={zerochan} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("youtube")) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
            if (props.post.link.includes("bandcamp")) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post.link, "_blank")}/>)
            }
        }
        if (jsx.length) {
            return (
                <div className="mobileinfo-row">
                    <span className="tag">Source:</span>
                    <span className={`tag-alt-link ${props.post.hidden ? "strikethrough" : ""}`} onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                    {jsx}
                </div>
            )
        }
        return null
    }

    const generateMirrorsJSX = () => {
        let jsx = [] as any
        if (props.post.mirrors) {
            if (props.post.mirrors.pixiv) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post.mirrors.pixiv, "_blank")}/>)
            }
            if (props.post.mirrors.soundcloud) {
                jsx.push(<img className="sidebar-social" src={soundcloud} onClick={() => window.open(props.post.mirrors.soundcloud, "_blank")}/>)
            }
            if (props.post.mirrors.sketchfab) {
                jsx.push(<img className="sidebar-social" src={sketchfab} onClick={() => window.open(props.post.mirrors.sketchfab, "_blank")}/>)
            }
            if (props.post.mirrors.twitter) {
                jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.post.mirrors.twitter, "_blank")}/>)
            }
            if (props.post.mirrors.deviantart) {
                jsx.push(<img className="sidebar-social" src={deviantart} onClick={() => window.open(props.post.mirrors.deviantart, "_blank")}/>)
            }
            if (props.post.mirrors.artstation) {
                jsx.push(<img className="sidebar-social" src={artstation} onClick={() => window.open(props.post.mirrors.artstation, "_blank")}/>)
            }
            if (props.post.mirrors.danbooru) {
                jsx.push(<img className="sidebar-social" src={danbooru} onClick={() => window.open(props.post.mirrors.danbooru, "_blank")}/>)
            }
            if (props.post.mirrors.gelbooru) {
                jsx.push(<img className="sidebar-social" src={gelbooru} onClick={() => window.open(props.post.mirrors.gelbooru, "_blank")}/>)
            }
            if (props.post.mirrors.safebooru) {
                jsx.push(<img className="sidebar-social" src={safebooru} onClick={() => window.open(props.post.mirrors.safebooru, "_blank")}/>)
            }
            if (props.post.mirrors.yandere) {
                jsx.push(<img className="sidebar-social" src={yandere} onClick={() => window.open(props.post.mirrors.yandere, "_blank")}/>)
            }
            if (props.post.mirrors.konachan) {
                jsx.push(<img className="sidebar-social" src={konachan} onClick={() => window.open(props.post.mirrors.konachan, "_blank")}/>)
            }
            if (props.post.mirrors.zerochan) {
                jsx.push(<img className="sidebar-social" src={zerochan} onClick={() => window.open(props.post.mirrors.zerochan, "_blank")}/>)
            }
            if (props.post.mirrors.youtube) {
                jsx.push(<img className="sidebar-social" src={youtube} onClick={() => window.open(props.post.mirrors.youtube, "_blank")}/>)
            }
            if (props.post.mirrors.bandcamp) {
                jsx.push(<img className="sidebar-social" src={bandcamp} onClick={() => window.open(props.post.mirrors.bandcamp, "_blank")}/>)
            }
        }
        if (jsx.length) {
            return (
                <div className="mobileinfo-row">
                    <span className="tag">Mirrors:</span>
                    {jsx}
                </div>
            )
        }
        return null
    }

    const triggerAddTranslation = () => {
        window.scrollTo(0, 0)
        const newMode = !translationMode
        setTranslationMode(newMode)
        if (newMode) setTranslationDrawingEnabled(true)
    }

    const triggerGroup = () => {
        setGroupPostID(props.post.postID)
    }

    const triggerTakedown = () => {
        setShowTakedownPostDialog(!showTakedownPostDialog)
    }

    const postHistory = () => {
        window.scrollTo(0, 0)
        history.push(`/post/history/${props.post.postID}`)
    }

    const generateUsernameJSX = (type?: string) => {
        let username = props.post.uploader
        let role = uploaderRole
        if (type === "updater") {
            username = props.post.updater 
            role = updaterRole
        }
        if (type === "approver") {
            username = props.post.approver 
            role = approverRole
        }
        if (role === "admin") {
            return (
                <div className="mobileinfo-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="mobileinfo-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="mobileinfo-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? history.push(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }

    const copyTagsJSX = () => {
        if (!session) return
        if (session.captchaNeeded) return null
        if (props.artists && props.characters && props.series && props.tags) {
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={() => copyTags()} onContextMenu={(event) => {event.preventDefault(); copyTags(true, true)}}>
                            <img className="mobileinfo-icon" src={tagIcon}/>
                            <span className="tag-red">Copy Tags</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const tagCaptchaJSX = () => {
        if (!session) return
        if (session.captchaNeeded) {
            if (!history.location.pathname.includes("/post/") && !history.location.pathname.includes("/edit-post")) return
            const toggleCaptcha = () => {
                sessionStorage.setItem("ignoreCaptcha", "false")
                history.go(0)
            }
            return (
                <div className="mobileinfo-subcontainer-column">
                    <div className="mobileinfo-row">
                        <span className="tag-hover" onClick={toggleCaptcha}>
                            <img className="mobileinfo-icon" src={tagIcon}/>
                            <span className="tag-red">Unlock Post</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const noTagsArtist = () => {
        if (!session) return
        if (session.captchaNeeded) {
            return (
            <div className="mobileinfo-row">
                <span className="tag">Artist:</span>
                <span className="tag-alt">{props.post.artist || "None"}</span>
            </div>
            )
        }
    }


    return (
        <div className="mobileinfo" onMouseEnter={() => setEnableDrag(false)}>
            <div className="mobileinfo-container">
            <div className="mobileinfo-content">

                {copyTagsJSX()}
                {tagCaptchaJSX()}

                {props.artists ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.artists.length > 1 ? "Artists" : "Artist"}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateArtistsJSX()}
                        {noTagsArtist()}
                        <div className="mobileinfo-row">
                            <span className="tag">Title:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.title || "None"}</span>
                        </div>
                        {props.post.translatedTitle ? 
                        <div className="mobileinfo-row">
                            <span className="tag">Translated:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{functions.toProperCase(props.post.translatedTitle)}</span>
                        </div>
                        : null}
                        <div className="mobileinfo-row">
                            <span className="tag">Posted:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.posted ? functions.formatDate(new Date(props.post.posted)) : "Unknown"}</span>
                        </div>
                        {generateSourceJSX()}
                        <div className="mobileinfo-row">
                            <span className="tag">Bookmarks:</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.bookmarks ? props.post.bookmarks : "?"}</span>
                        </div>
                        {generateMirrorsJSX()}
                    </div> </>
                : null}

                {props.characters ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">{props.characters.length > 1 ? "Characters" : "Character"}</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateCharactersJSX()}
                    </div> </>
                : null}

                {props.series ? <>
                    <div className="mobileinfo-title-container">
                            <span className="mobileinfo-title">Series</span>
                        </div>
                    <div className="mobileinfo-subcontainer-column">
                        {generateSeriesJSX()}
                    </div> </>
                : null}

                {props.tags ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">Tags</span>
                    </div>
                    <div className="mobileinfo-subcontainer">
                        {generateTagJSX()}
                    </div> </> 
                : null}

                {props.post ? <>
                    <div className="mobileinfo-title-container">
                        <span className="mobileinfo-title">Details</span>
                    </div>
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                                <img className="mobileinfo-img" src={uploaderImage}/>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Uploader:</span>
                                {generateUsernameJSX("uploader")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Uploaded:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                            </div>
                        </div>
                        {props.post.uploadDate !== props.post.updatedDate ? 
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Updater:</span>
                                {generateUsernameJSX("updater")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Updated:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                            </div>
                        </div> : null}
                        {props.post.uploader !== props.post.approver ?
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Approver:</span>
                                {generateUsernameJSX("approver")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Approved:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.approveDate))}</span>
                            </div>
                        </div> : null}
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Type:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.type)}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Restrict:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.restrict)}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Style:</span>
                                <span className="tag-alt">{functions.toProperCase(props.post.style)}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Favorites:</span>
                                <span className="tag-alt">{props.post.favoriteCount || 0}</span>
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Cuteness:</span>
                                <span className="tag-alt">{props.post.cuteness || 500}</span>
                            </div>
                        </div>
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag-hover" onClick={() => copyHash()} onAuxClick={() => copyHash()} onContextMenu={(event) => {event.preventDefault(); copyHash()}}>
                                    <img className="mobileinfo-icon" src={hashIcon} style={{filter: getFilter()}}/>
                                    <span className="tag">Copy Hash</span>
                                </span>
                            </div>
                        </div>
                    </div></>
                : null}

                {props.post && session.username ? 
                    <div className="mobileinfo-subcontainer-column">
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerTagEdit}>
                                <img className="mobileinfo-icon" src={tagEdit} style={{filter: getFilter()}}/>
                                <span className="tag">Tag Edit</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerSourceEdit}>
                                <img className="mobileinfo-icon" src={sourceEdit} style={{filter: getFilter()}}/>
                                <span className="tag">Source Edit</span>
                            </span>
                        </div>
                        {!props.unverified && props.post.restrict !== "explicit" ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerSetAvatar}>
                                <img className="mobileinfo-icon" src={setAvatar} style={{filter: getFilter()}}/>
                                <span className="tag">Set Avatar</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerGroup}>
                                <img className="sidebar-icon" src={group} style={{filter: getFilter()}}/>
                                <span className="tag">Add to Group</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerAddTranslation}>
                                <img className="mobileinfo-icon" src={addTranslation} style={{filter: getFilter()}}/>
                                <span className="tag">Add Translation</span>
                            </span>
                        </div> : null}
                        {!props.unverified && permissions.canPrivate(session, props.artists) ? <div className="sidebar-row">
                            <span className="tag-hover" onClick={privatePost}>
                                <img className="mobileinfo-icon" src={props.post.private ? unprivateIcon : privateIcon} style={{filter: getFilter()}}/>
                                <span className="tag">{props.post.private ? "Unprivate" : "Private"}</span>
                            </span>
                        </div> : null}
                        {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerTakedown}>
                                <img className="mobileinfo-icon" src={props.post.hidden ? restore : takedown} style={{filter: getFilter()}}/>
                                <span className="tag">{props.post.hidden ? "Restore" : "Takedown"}</span>
                            </span>
                        </div> : null}
                        {props.unverified ? <>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={compressingDialog}>
                                <img className="sidebar-icon" src={compressIcon}/>
                                <span className="tag">Compress</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={upscalingDialog}>
                                <img className="sidebar-icon" src={upscaleIcon}/>
                                <span className="tag">Upscale</span>
                            </span>
                        </div></> : null}
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={editPost}>
                                <img className="mobileinfo-icon" src={edit}/>
                                <span className="tag-red">Edit</span>
                            </span>
                        </div>
                        {props.unverified ? <>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={approvePost}>
                                <img className="mobileinfo-icon" src={approveGreen}/>
                                <span className="tag-green">Approve</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={rejectPost}>
                                <img className="mobileinfo-icon" src={rejectRed}/>
                                <span className="tag-red">Reject</span>
                            </span>
                        </div>
                        </> : null}
                        {!props.unverified && permissions.isMod(session) ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={lockPost}>
                                <img className="mobileinfo-icon" src={props.post.locked ? unlockIcon : lockIcon}/>
                                <span className="tag-red">{props.post.locked ? "Unlock" : "Lock"}</span>
                            </span>
                        </div> : null}
                        {!props.unverified ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={postHistory}>
                                <img className="mobileinfo-icon" src={historyIcon}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div> : null}
                        {!props.unverified ?
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={deletePost}>
                                <img className="mobileinfo-icon" src={deleteIcon}/>
                                <span className="tag-red">Delete</span>
                            </span>
                        </div> : null}
                    </div>
                : null}
            </div>
        </div> 
        </div>
    )
}

export default MobileInfo