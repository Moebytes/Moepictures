import React, {useEffect, useState, useReducer} from "react"
import {useNavigate, useParams} from "react-router-dom"
import favicon from "../../assets/icons/favicon.png"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useFlagSelector, useMiscDialogActions, useMessageDialogActions,
useCacheSelector, useCacheActions} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import Carousel from "../../components/site/Carousel"
import VerticalCarousel from "../../components/site/VerticalCarousel"
import adminLabel from "../../assets/icons/admin-label.png"
import modLabel from "../../assets/icons/mod-label.png"
import systemLabel from "../../assets/icons/system-label.png"
import premiumLabel from "../../assets/icons/premium-label.png"
import contributorLabel from "../../assets/icons/contributor-label.png"
import premiumContributorLabel from "../../assets/icons/premium-contributor-label.png"
import curatorLabel from "../../assets/icons/curator-label.png"
import premiumCuratorLabel from "../../assets/icons/premium-curator-label.png"
import banIcon from "../../assets/icons/ban.png"
import unbanIcon from "../../assets/icons/unban.png"
import promoteIcon from "../../assets/icons/promote.png"
import dmIcon from "../../assets/icons/dm.png"
import jsxFunctions from "../../structures/JSXFunctions"
import {EditCounts, PrunedUser, CommentSearch, Favgroup, PostSearch, TagCount, ForumPostSearch} from "../../types/Types"
import "./styles/userpage.less"

let limit = 25

const UserPage: React.FunctionComponent = () => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveFavgroup} = useActiveActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {updateUserFlag} = useFlagSelector()
    const {setUpdateUserFlag, setCommentSearchFlag} = useFlagActions()
    const {setBanName, setUnbanName, setPromoteName} = useMiscDialogActions()
    const {setDMTarget} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const {setPosts} = useCacheActions()
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0)
    const [uploads, setUploads] = useState([] as PostSearch[])
    const [appendUploadImages, setAppendUploadImages] = useState([] as string[])
    const [favorites, setFavorites] = useState([] as PostSearch[])
    const [appendFavoriteImages, setAppendFavoriteImages] = useState([] as string[])
    const [comments, setComments] = useState([] as CommentSearch[])
    const [forumPosts, setForumPosts] = useState([] as ForumPostSearch[])
    const [favgroups, setFavgroups] = useState([] as Favgroup[])
    const [uploadImages, setUploadImages] = useState([] as string[])
    const [favoriteImages, setFavoriteImages] = useState([] as string[])
    const [favoriteTags, setFavoriteTags] = useState([] as TagCount[])
    const [user, setUser] = useState(null as PrunedUser | null)
    const [defaultIcon, setDefaultIcon] = useState(false)
    const [counts, setCounts] = useState(null as EditCounts | null)
    const navigate = useNavigate()
    const {username} = useParams() as {username: string}

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const fetchUser = async () => {
        const user = await functions.get("/api/user", {username}, session, setSessionFlag)
        if (!user) return functions.replaceLocation("/404")
        setUser(user)
        setDefaultIcon(user.image ? false : true)
        forceUpdate()
    }

    const updateUploads = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const uploads = await functions.get("/api/user/uploads", {username, rating}, session, setSessionFlag)
        const images = uploads.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        const newUploads = uploads
        let offset = newUploads.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/uploads", {limit, rating, offset}, session, setSessionFlag)
        newUploads.push(...result)
        const images = result.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(newUploads)
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const favorites = await functions.get("/api/user/favorites", {username, rating}, session, setSessionFlag)
        const images = favorites.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        const newFavorites = favorites
        let offset = newFavorites.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/favorites", {limit, rating, offset}, session, setSessionFlag)
        newFavorites.push(...result)
        const images = result.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(newFavorites)
        setAppendFavoriteImages(images)
    }

    const updateFavgroups = async () => {
        const favgroups = await functions.get("/api/user/favgroups", null, session, setSessionFlag)
        setFavgroups(favgroups)
    }

    const updateComments = async () => {
        const comments = await functions.get("/api/user/comments", {username, sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c) => functions.isR18(ratingType) ? functions.isR18(c.post?.rating) : !functions.isR18(c.post?.rating))
        setComments(filtered)
    }

    const updateForumPosts = async () => {
        const forumPosts = await functions.get("/api/user/forumposts", {username, sort: "date"}, session, setSessionFlag)
        setForumPosts(forumPosts)
    }

    const updateCounts = async () => {
        const counts = await functions.get("/api/user/edit/counts", {username}, session, setSessionFlag)
        setCounts(counts)
    }

    const updateFavoriteTags = async () => {
        const favoriteTags = await functions.get("/api/tagfavorites", {username}, session, setSessionFlag)
        setFavoriteTags(favoriteTags)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = `${functions.toProperCase(username)}`
    }, [])

    useEffect(() => {
        fetchUser()
        updateUploads()
        updateFavorites()
        updateFavgroups()
        updateComments()
        updateForumPosts()
        updateCounts()
        updateFavoriteTags()
    }, [username, ratingType, session])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const setUp = (img: string, index: number, newTab: boolean) => {
        setUploadIndex(index)
        const post = uploads[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(uploads)
    }

    const setFav = (img: string, index: number, newTab: boolean) => {
        setFavoriteIndex(index)
        const post = favorites[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(favorites)
    }

    const getUserImg = () => {
        if (!user) return ""
        return user.image ? functions.getTagLink("pfp", user.image, user.imageHash) : favicon
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!user?.imagePost) return
        event.stopPropagation()
        functions.openPost(user.imagePost, event, navigate, session, setSessionFlag)
    }

    const viewFavorites = () => {
        if (!user) return
        navigate("/posts")
        setSearch(`favorites:${user.username}`)
        setSearchFlag(true)
    }

    const viewUploads = () => {
        if (!user) return
        navigate("/posts")
        setSearch(`uploads:${user.username}`)
        setSearchFlag(true)
    }

    const viewComments = () => {
        if (!user) return
        navigate("/comments")
        setCommentSearchFlag(`comments:${user.username}`)
    }

    const viewForumPosts = () => {
        if (!user) return
        navigate(`/posts/${user.username}`)
    }

    const searchTag = (event: React.MouseEvent, tag?: string) => {
        if (!tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(tag)
            setSearchFlag(true)
        }
    }

    const generateFavoriteTagsJSX = () => {
        if (!user) return null
        if (!favoriteTags.length) return null
        if (user.publicTagFavorites) {
            return (
                <div className="user-column">
                    <span className="user-title">{i18n.user.favoriteTags} <span className="user-text-alt">{favoriteTags.length}</span></span>
                    <div className="tag-alias-button-container">
                        {favoriteTags.map((tag) =>
                            <button className="tag-alias-button" onClick={(event) => searchTag(event, tag.tag)}>{tag.tag.replaceAll("-", " ")}</button>
                        )}
                    </div>
                </div> 
            )
        } else {
            return (
                <div className="user-column">
                    <span className="user-text">{i18n.user.favoriteTags}: <span className="user-text-alt">{i18n.sort.private}</span></span>
                </div>
            )
        }
    }

    const generateFavoritesJSX = () => {
        if (!user) return null
        if (!favorites.length) return null
        if (user.publicFavorites) {
            return (
                <div className="user-column">
                    <span className="user-title" onClick={viewFavorites}>{i18n.sort.favorites} <span className="user-text-alt">{favorites[0].postCount}</span></span>
                    <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex} update={updateFavoriteOffset} appendImages={appendFavoriteImages}/>
                </div> 
            )
        } else {
            return (
                <div className="user-column">
                    <span className="user-text">{i18n.sort.favorites}: <span className="user-text-alt">{i18n.sort.private}</span></span>
                </div>
            )
        }
    }

    const generateUsernameJSX = () => {
        if (!user) return
        if (user?.role === "admin") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain admin-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={adminLabel}/>
                </div>
            )
        } else if (user?.role === "mod") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain mod-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={modLabel}/>
                </div>
            )
        } else if (user?.role === "system") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain system-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={systemLabel}/>
                </div>
            )
        } else if (user?.role === "premium-curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumCuratorLabel}/>
                </div>
            )
        } else if (user?.role === "curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={curatorLabel}/>
                </div>
            )
        } else if (user?.role === "premium-contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumContributorLabel}/>
                </div>
            )
        } else if (user?.role === "contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain contributor-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={contributorLabel}/>
                </div>
            )
        } else if (user?.role === "premium") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumLabel}/>
                </div>
            )
        }
        return <span className={`user-name ${user.banned ? "banned" : ""}`}>{functions.toProperCase(username)}</span>
    }

    const banDialog = () => {
        if (!user) return
        if (user.banned) {
            setUnbanName(username)
        } else {
            setBanName(username)
        }
    }

    const promoteDialog = () => {
        setPromoteName(username)
    }

    const dmDialog = () => {
        setDMTarget(username)
    }

    useEffect(() => {
        if (updateUserFlag) {
            fetchUser()
            setUpdateUserFlag(false)
        }
    }, [updateUserFlag])

    const banJSX = () => {
        if (!user?.banned) return null
        if (user.banExpiration && new Date(user.banExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-ban-text">{i18n.user.banReason} {functions.timeUntil(user.banExpiration, i18n)}</span>
                </div>
            )
        } else {
            return <span className="user-ban-text">{i18n.user.ban}</span>
        }
    }

    const generateFavgroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < favgroups.length; i++) {
            let favgroup = favgroups[i]
            if (favgroup.private) continue
            if (functions.isR18(ratingType)) {
                if (!functions.isR18(favgroup.rating)) continue
            } else {
                if (functions.isR18(favgroup.rating)) continue
            }
            const images = favgroup.posts.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
            const viewFavgroup = () => {
                navigate(`/favgroup/${username}/${favgroup.slug}`)
            }
            const setFavgroup = (img: string, index: number, newTab: boolean) => {
                const post = favgroup.posts[index]
                if (newTab) {
                    window.open(`/post/${post.postID}/${post.slug}`, "_blank")
                } else {
                    navigate(`/post/${post.postID}/${post.slug}`)
                }
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
                setPosts(favgroup.posts)
                setTimeout(() => {
                    setActiveFavgroup(favgroup)
                }, 200)
            }
            jsx.push(
                <div className="user-column">
                    <div className="user-title-container">
                        <span className="user-title" onClick={viewFavgroup}>{favgroup.name} <span className="user-text-alt">{favgroup.postCount}</span></span>
                    </div>
                    <Carousel images={images} noKey={true} set={setFavgroup} index={0}/>
                </div>
            )
        }
        return jsx
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {user ?
                <div className="user">
                    <div className="user-top-container">
                        <img className="user-img" src={getUserImg()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        {generateUsernameJSX()}
                        {session.username && (session.username !== username) && user.role !== "system" && !session.banned ? <img className="user-opt-icon" src={dmIcon} onClick={dmDialog}/> : null}
                        {permissions.isMod(session) && !permissions.isMod(user) ? <img className="user-opt-icon" src={user.banned ? unbanIcon : banIcon} onClick={banDialog}/> : null}
                        {permissions.isAdmin(session) && (session.username !== username) ? <img className="user-opt-icon" src={promoteIcon} onClick={promoteDialog}/> : null}
                    </div>
                    {banJSX()}
                    <div className="user-row">
                        <span className="user-text">{i18n.user.bio}: {jsxFunctions.renderText(user.bio || i18n.user.noBio, emojis, "reply")}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.joinDate}: {functions.prettyDate(user.joinDate, i18n)}</span>
                    </div>
                    {counts?.postEdits || counts?.tagEdits || counts?.noteEdits || counts?.groupEdits ? 
                    <div className="user-row">
                        <span className="user-title" style={{marginRight: "10px"}}>{i18n.labels.edits}:</span>
                    {counts.postEdits > 0 ? 
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${user.username}/post/history`)}>
                        {i18n.buttons.post} {!mobile ? <span className="user-text-alt">{counts.postEdits}</span> : null}</span>
                    : null}
                    {counts.tagEdits > 0 ? 
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${user.username}/tag/history`)}>
                        {i18n.tag.tag} {!mobile ? <span className="user-text-alt">{counts.tagEdits}</span> : null}</span>
                    : null}
                    {counts.noteEdits > 0 ?
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${user.username}/note/history`)}>
                        {i18n.labels.note} {!mobile ? <span className="user-text-alt">{counts.noteEdits}</span> : null}</span>
                    : null}
                    {counts.groupEdits > 0 ?
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${user.username}/group/history`)}>
                        {i18n.labels.group} {!mobile ? <span className="user-text-alt">{counts.groupEdits}</span> : null}</span>
                    : null}
                    </div> : null}
                    {permissions.isMod(session) && user.deletedPosts?.length ? <div className="user-row">
                        <span className="user-text">{i18n.user.deletedPosts}: <span className="user-text-action">{user.deletedPosts.length}</span></span>
                    </div> : null}
                    {generateFavoriteTagsJSX()}
                    {generateFavgroupsJSX()}
                    {generateFavoritesJSX()}
                    {uploads.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewUploads}>{i18n.labels.uploads} <span className="user-text-alt">{uploads[0].postCount}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex} update={updateUploadOffset} appendImages={appendUploadImages}/>
                    </div> : null}
                    {comments.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewComments}>{i18n.navbar.comments} <span className="user-text-alt">{comments.length}</span></span>
                        <VerticalCarousel items={comments} type="comment"/>
                    </div> : null}
                    {forumPosts.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewForumPosts}>{i18n.user.forumPosts} <span className="user-text-alt">{forumPosts.length}</span></span>
                        <VerticalCarousel items={forumPosts} type="forumpost"/>
                    </div> : null}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserPage