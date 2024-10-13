import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideNavbarContext, HideSortbarContext, EnableDragContext, MobileContext, UnverifiedPostsContext,
RelativeContext, HideTitlebarContext, SearchContext, SearchFlagContext, PostsContext, ShowDeletePostDialogContext,
TagsContext, RandomFlagContext, ImageSearchFlagContext, SessionContext, SessionFlagContext, QuickEditIDContext, ShowTakedownPostDialogContext,
SiteHueContext, SiteLightnessContext, SiteSaturationContext, TranslationModeContext, TranslationDrawingEnabledContext,
ActionBannerContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import permissions from "../structures/Permissions"
import favicon from "../assets/icons/favicon.png"
import setAvatar from "../assets/icons/setavatar.png"
import addTranslation from "../assets/icons/addtranslation.png"
import report from "../assets/icons/report.png"
import edit from "../assets/icons/edit.png"
import historyIcon from "../assets/icons/history.png"
import quickEdit from "../assets/icons/quickedit.png"
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
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {tags, setTags} = useContext(TagsContext)
    const {randomFlag, setRandomFlag} = useContext(RandomFlagContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const {showTakedownPostDialog, setShowTakedownPostDialog} = useContext(ShowTakedownPostDialogContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const {quickEditID, setQuickEditID} = useContext(QuickEditIDContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {translationDrawingEnabled, setTranslationDrawingEnabled} = useContext(TranslationDrawingEnabledContext)
    const {actionBanner, setActionBanner} = useContext(ActionBannerContext)
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
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image) : favicon)
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await functions.get("/api/user", {username: props.post.updater}, session, setSessionFlag)
            if (updater?.role) setUpdaterRole(updater.role)
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
            const link = functions.getTagLink("artist", props.artists[i].image)
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
                            <span className="artist-tag" onClick={() => tagClick()}>{props.artists[i].tag.replaceAll("-", " ")}</span>
                            {artistSocials()}
                            <span className="tag-count">{props.artists[i].count}</span>
                        </span>
                    </div>
                </>)
        }
        return jsx
    }

    const generateCharactersJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.characters.length; i++) {
            const link = functions.getTagLink("character", props.characters[i].image)
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
                        <span className="character-tag" onClick={() => tagClick()}>{props.characters[i].tag.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className="tag-count">{props.characters[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.series.length; i++) {
            const link = functions.getTagLink("series", props.series[i].image)
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
                        <span className="series-tag" onClick={() => tagClick()}>{props.series[i].tag.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className="tag-count">{props.series[i].count}</span>
                    </span>
                </div>
                </>)
        }
        return jsx
    }

    const generateTagJSX = () => {
        let jsx = [] as any
        let currentTags = props.tags ? props.tags : tags
        let max = currentTags.length > maxTags ? maxTags : currentTags.length
        for (let i = 0; i < max; i++) {
            if (!currentTags[i]) break
            const tagClick = () => {
                history.push(`/tag/${currentTags[i].tag}`)
            }
            const tagClass = () => {
                if (currentTags[i].type === "artist") return "artist-tag"
                if (currentTags[i].type === "character") return "character-tag"
                if (currentTags[i].type === "series") return "series-tag"
                if (currentTags[i].type === "meta") return "meta-tag"
                return "tag"
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className={tagClass()}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{currentTags[i].count}</span>
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
        setShowDeletePostDialog((prev: boolean) => !prev)
    }

    const editPost = async () => {
        if (props.unverified) return history.push(`/unverified/edit-post/${props.post.postID}`)
        history.push(`/edit-post/${props.post.postID}`)
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

    const triggerQuickEdit = () => {
        setQuickEditID({post: props.post, artists: props.artists, 
            characters: props.characters, series: props.series,
            tags: props.tags, unverified: props.unverified})
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

    const triggerTakedown = () => {
        setShowTakedownPostDialog((prev: boolean) => !prev)
    }

    const postHistory = () => {
        window.scrollTo(0, 0)
        history.push(`/post/history/${props.post.postID}`)
    }

    const generateUsernameJSX = (type?: string) => {
        let username = type === "uploader" ? props.post.uploader : props.post.updater 
        const role = type === "uploader" ? uploaderRole : updaterRole
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
                            <span className="tag">{props.post.type === "model" ? "Modeled:" : props.post.type === "audio" ? "Produced:" : "Drawn:"}</span>
                            <span className={`tag-alt ${props.post.hidden ? "strikethrough" : ""}`}>{props.post.drawn ? functions.formatDate(new Date(props.post.drawn)) : "Unknown"}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag">Source:</span>
                            <span className={`tag-alt-link ${props.post.hidden ? "strikethrough" : ""}`} onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                        </div>
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
                        <div className="mobileinfo-sub-row">
                            <div className="mobileinfo-row">
                                <span className="tag">Updater:</span>
                                {generateUsernameJSX("updater")}
                            </div>
                            <div className="mobileinfo-row">
                                <span className="tag">Updated:</span>
                                <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                            </div>
                        </div>
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
                            <span className="tag-hover" onClick={triggerQuickEdit}>
                                <img className="mobileinfo-icon" src={quickEdit} style={{filter: getFilter()}}/>
                                <span className="tag">Quick Edit</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerSetAvatar}>
                                <img className="mobileinfo-icon" src={setAvatar} style={{filter: getFilter()}}/>
                                <span className="tag">Set Avatar</span>
                            </span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerAddTranslation}>
                                <img className="mobileinfo-icon" src={addTranslation} style={{filter: getFilter()}}/>
                                <span className="tag">Add Translation</span>
                            </span>
                        </div>
                        {permissions.isElevated(session) ? <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={triggerTakedown}>
                                <img className="mobileinfo-icon" src={props.post.hidden ? restore : takedown} style={{filter: getFilter()}}/>
                                <span className="tag">{props.post.hidden ? "Restore" : "Takedown"}</span>
                            </span>
                        </div> : null}
                        {/* 
                        <div className="mobileinfo-row">
                            <span className="tag-hover">
                                <img className="mobileinfo-icon" src={getReport()}/>
                                <span className="tag">Report</span>
                            </span>
                        </div> */}
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
                        <div className="mobileinfo-row">
                            <span className="tag-hover" onClick={postHistory}>
                                <img className="mobileinfo-icon" src={historyIcon}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div>
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