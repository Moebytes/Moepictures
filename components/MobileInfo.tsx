import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideNavbarContext, HideSortbarContext, EnableDragContext, MobileContext, UnverifiedPostsContext,
RelativeContext, HideTitlebarContext, SearchContext, SearchFlagContext, PostsContext, ShowDeletePostDialogContext,
TagsContext, RandomFlagContext, ImageSearchFlagContext, SessionContext, QuickEditIDContext, QuickEditUnverifiedContext,
SiteHueContext, SiteLightnessContext, SiteSaturationContext, TranslationModeContext, TranslationDrawingEnabledContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import setAvatar from "../assets/icons/setavatar.png"
import addTranslation from "../assets/icons/addtranslation.png"
import report from "../assets/icons/report.png"
import edit from "../assets/icons/edit.png"
import historyIcon from "../assets/icons/history.png"
import quickEdit from "../assets/icons/quickedit.png"
import deleteIcon from "../assets/icons/delete.png"
import rejectRed from "../assets/icons/reject-red.png"
import approveGreen from "../assets/icons/approve-green.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import tagIcon from "../assets/icons/tag.png"
import website from "../assets/icons/support.png"
import pixiv from "../assets/icons/pixiv.png"
import twitter from "../assets/icons/twitter.png"
import deviantart from "../assets/icons/deviantart.png"
import artstation from "../assets/icons/artstation.png"
import fandom from "../assets/icons/fandom.png"
import danbooru from "../assets/icons/danbooru.png"
import gelbooru from "../assets/icons/gelbooru.png"
import safebooru from "../assets/icons/safebooru.png"
import yandere from "../assets/icons/yandere.png"
import konachan from "../assets/icons/konachan.png"
import functions from "../structures/Functions"
import axios from "axios"
import "./styles/mobileinfo.less"

interface Props {
    post?: any
    artists?: any 
    characters?: any 
    series?: any
    tags?: any
    unverified?: boolean
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
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const [maxTags, setMaxTags] = useState(23)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const {quickEditID, setQuickEditID} = useContext(QuickEditIDContext)
    const {quickEditUnverified, setQuickEditUnverified} = useContext(QuickEditUnverifiedContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {translationDrawingEnabled, setTranslationDrawingEnabled} = useContext(TranslationDrawingEnabledContext)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTags = async () => {
        const tags = await functions.parseTags(posts)
        setTags(tags)
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await axios.get("/api/user", {params: {username: props.post.uploader}, withCredentials: true}).then((r) => r.data)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image) : favicon)
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await axios.get("/api/user", {params: {username: props.post.updater}, withCredentials: true}).then((r) => r.data)
            if (updater?.role) setUpdaterRole(updater.role)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()
    }, [])

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
                history.push(`/posts`)
                setSearch(props.artists[i].tag)
                setSearchFlag(true)
            }
            const artistSocials = () => {
                let jsx = [] as any 
                if (props.artists[i].website) {
                    jsx.push(<img className="mobileinfo-social" src={website} onClick={() => window.open(props.artists[i].website, "_blank")}/>)
                }
                if (props.artists[i].pixiv) {
                    jsx.push(<img className="mobileinfo-social" src={pixiv} onClick={() => window.open(props.artists[i].pixiv, "_blank")}/>)
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
                            <span className="tag" onClick={() => tagClick()}>{props.artists[i].tag.replaceAll("-", " ")}</span>
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
                history.push(`/posts`)
                setSearch(props.characters[i].tag)
                setSearchFlag(true)
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
                        <span className="tag" onClick={() => tagClick()}>{props.characters[i].tag.replaceAll("-", " ")}</span>
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
                history.push(`/posts`)
                setSearch(props.series[i].tag)
                setSearchFlag(true)
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
                        <span className="tag" onClick={() => tagClick()}>{props.series[i].tag.replaceAll("-", " ")}</span>
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
                history.push(`/posts`)
                setSearch(currentTags[i].tag)
                setSearchFlag(true)
            }
            jsx.push(
                <div className="mobileinfo-row">
                    <span className="tag-hover" onClick={() => tagClick()}>
                        <span className="tag">{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
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
        const result = await functions.imageSearch(file)
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
        await axios.post("/api/post/approve", {postID: props.post.postID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        modNext()
    }

    const rejectPost = async () => {
        await axios.post("/api/post/reject", {postID: props.post.postID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        modNext()
    }

    const triggerSetAvatar = () => {
        window.scrollTo(0, 0)
        history.push(`/set-avatar/${props.post.postID}`)
    }

    const triggerQuickEdit = () => {
        if (props.unverified) {
            setQuickEditUnverified(true)
        } else {
            setQuickEditUnverified(false)
        }
        setQuickEditID(props.post.postID)
    }

    const generateMirrorsJSX = () => {
        let jsx = [] as any
        if (props.post.mirrors) {
            if (props.post.mirrors.pixiv) {
                jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.post.mirrors.pixiv, "_blank")}/>)
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

    const tagCaptchaJSX = () => {
        if (!session) return
        if (session.captchaAmount === undefined) session.captchaAmount = 0
        if (session.captchaAmount > 1000) {
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
                            <span className="tag-red">Show Tags</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const noTagsArtist = () => {
        if (!session) return
        if (session.captchaAmount === undefined) session.captchaAmount = 0
        if (session.captchaAmount > 1000) {
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
                            <span className="tag-alt">{props.post.title || "None"}</span>
                        </div>
                        {props.post.translatedTitle ? 
                        <div className="mobileinfo-row">
                            <span className="tag">Translated:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.translatedTitle)}</span>
                        </div>
                        : null}
                        <div className="mobileinfo-row">
                            <span className="tag">Drawn:</span>
                            <span className="tag-alt">{props.post.drawn ? functions.formatDate(new Date(props.post.drawn)) : "Unknown"}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag">Source:</span>
                            <span className="tag-alt-link" onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                        </div>
                        <div className="mobileinfo-row">
                            <span className="tag">Bookmarks:</span>
                            <span className="tag-alt">{props.post.bookmarks ? props.post.bookmarks : "?"}</span>
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
                                <span className="tag-alt">{props.post.cutenessAvg || 500}</span>
                            </div>
                        </div>
                    </div> </>
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