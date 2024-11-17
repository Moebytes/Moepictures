import React, {useEffect, useContext, useState, useReducer} from "react"
import {useHistory, useLocation} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import PostImage from "../components/PostImage"
import PostModel from "../components/PostModel"
import PostSong from "../components/PostSong"
import PostImageOptions from "../components/PostImageOptions"
import CutenessMeter from "../components/CutenessMeter"
import Comments from "../components/Comments"
import Commentary from "../components/Commentary"
import BuyLink from "../components/BuyLink"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import DeletePostDialog from "../dialogs/DeletePostDialog"
import TakedownPostDialog from "../dialogs/TakedownPostDialog"
import PrivatePostDialog from "../dialogs/PrivatePostDialog"
import LockPostDialog from "../dialogs/LockPostDialog"
import DeleteCommentDialog from "../dialogs/DeleteCommentDialog"
import EditCommentDialog from "../dialogs/EditCommentDialog"
import EditTranslationDialog from "../dialogs/EditTranslationDialog"
import SaveTranslationDialog from "../dialogs/SaveTranslationDialog"
import ReportCommentDialog from "../dialogs/ReportCommentDialog"
import TagEditDialog from "../dialogs/TagEditDialog"
import SourceEditDialog from "../dialogs/SourceEditDialog"
import FavgroupDialog from "../dialogs/FavGroupDialog"
import GroupDialog from "../dialogs/GroupDialog"
import ParentDialog from "../dialogs/ParentDialog"
import OCRDialog from "../dialogs/OCRDialog"
import RevertPostHistoryDialog from "../dialogs/RevertPostHistoryDialog"
import RevertTranslationHistoryDialog from "../dialogs/RevertTranslationHistoryDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import Parent from "../components/Parent"
import Children from "../components/Children"
import ArtistWorks from "../components/ArtistWorks"
import Related from "../components/Related"
import MobileInfo from "../components/MobileInfo"
import historyIcon from "../assets/icons/history-state.png"
import currentIcon from "../assets/icons/current.png"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions, 
useLayoutSelector, useSearchSelector, useFlagSelector, useCacheActions, usePostDialogActions, 
useTranslationDialogSelector, useTranslationDialogActions, useActiveSelector, usePostDialogSelector,
useCacheSelector, useInteractionActions,
useSearchActions} from "../store"
import permissions from "../structures/Permissions"
import "./styles/postpage.less"

let characterTag = ""

interface Props {
    match?: any
}

const PostPage: React.FunctionComponent<Props> = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {activeFavgroup} = useActiveSelector()
    const {setHeaderText, setSidebarText, setActiveGroup} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {restrictType} = useSearchSelector()
    const {setRestrictType} = useSearchActions()
    const {posts} = useCacheSelector()
    const {setPosts, setTags} = useCacheActions()
    const {postFlag} = useFlagSelector()
    const {setReloadPostFlag, setRedirect, setPostFlag, setDownloadIDs, setDownloadFlag} = useFlagActions()
    const {revertPostHistoryID, revertPostHistoryFlag} = usePostDialogSelector()
    const {setRevertPostHistoryID, setRevertPostHistoryFlag} = usePostDialogActions()
    const {revertTranslationHistoryID, revertTranslationHistoryFlag} = useTranslationDialogSelector()
    const {setRevertTranslationHistoryID, setRevertTranslationHistoryFlag} = useTranslationDialogActions()
    const [images, setImages] = useState([]) as any
    const [childPosts, setChildPosts] = useState([]) as any
    const [artistPosts, setArtistPosts] = useState([]) as any
    const [relatedPosts, setRelatedPosts] = useState([]) as any
    const [parentPost, setParentPost] = useState(null) as any
    const [image, setImage] = useState("") as any
    const [post, setPost] = useState(null) as any
    const [loaded, setLoaded] = useState(false)
    const [tagCategories, setTagCategories] = useState(null) as any
    const [order, setOrder] = useState(1)
    const [historyID, setHistoryID] = useState(null as any)
    const [translationID, setTranslationID] = useState(null as any)
    const [groups, setGroups] = useState([]) as any
    const history = useHistory()
    const location = useLocation()
    const postID = props?.match.params.id
    const slug = props?.match.params.slug

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setSidebarText("")
        setReloadPostFlag(true)
        document.title = "Post"
        const historyParam = new URLSearchParams(window.location.search).get("history")
        setHistoryID(historyParam)
        const translationParam = new URLSearchParams(window.location.search).get("translation")
        setTranslationID(translationParam)
        const orderParam = new URLSearchParams(window.location.search).get("order")
        if (orderParam) setOrder(Number(orderParam))
        const onDOMLoaded = () => {
            if (!historyParam) {
                const savedPost = localStorage.getItem("savedPost")
                const savedTags = localStorage.getItem("savedTags")
                if (savedPost) setPost(JSON.parse(savedPost))
                if (savedTags) setTagCategories(JSON.parse(savedTags))
                if (!posts?.length) {
                    const savedPosts = localStorage.getItem("savedPosts")
                    if (savedPosts) setPosts(JSON.parse(savedPosts))
                }
            }
            setTimeout(() => {
                const savedOrder = localStorage.getItem("order")
                if (savedOrder) setOrder(Number(savedOrder))
            }, 200)
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [location])

    useEffect(() => {
        if (!post) return
        const searchParams = new URLSearchParams(window.location.search)
        const newPath = location.pathname.replace(/(?<=\d+)\/[^/]+$/, "") + `/${post.slug}`
        history.replace(`${newPath}?${searchParams}`)
    }, [post])

    useEffect(() => {
        localStorage.setItem("order", String(order))
        let orderParam = new URLSearchParams(window.location.search).get("order")
        if (!orderParam) orderParam = "1"
        setTimeout(() => {
            const savedOrder = localStorage.getItem("order")
            if (Number(orderParam) !== Number(savedOrder)) {
                const searchParams = new URLSearchParams(window.location.search)
                if (Number(savedOrder) > 1) {
                    searchParams.set("order", savedOrder!)
                } else {
                    searchParams.delete("order")
                }
                history.replace(`${location.pathname}?${searchParams.toString()}`)
            }
        }, 300)
    }, [order])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie || !post) return
        if (post.postID !== postID) return
        if (!session.username) {
            setRedirect(slug ? `/post/${postID}/${slug}` : `/post/${postID}`)
        }
        if (!session.username && post.restrict !== "safe") {
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (post.restrict === "explicit") {
            if (!session.showR18) {
                functions.replaceLocation("/404")
            } else {
                setLoaded(true)
            }
        } else {
            setLoaded(true)
        }
    }, [session, post])

    const updateChildren = async () => {
        if (post) {
            const childPosts = await functions.get("/api/post/children", {postID: post.postID}, session, setSessionFlag).catch(() => [])
            if (childPosts?.[0]) {
                setChildPosts(childPosts)
            } else {
                setChildPosts([])
            }
        }
    }

    const updateParent = async () => {
        if (post) {
            const parentPost = await functions.get("/api/post/parent", {postID: post.postID}, session, setSessionFlag).catch(() => null)
            if (parentPost) {
                setParentPost(parentPost)
            } else {
                setParentPost(null)
            }
        }
    }

    const updateGroups = async () => {
        if (post) {
            const groups = await functions.get("/api/groups", {postID: post.postID}, session, setSessionFlag).catch(() => [])
            if (groups?.length) {
                setGroups(groups)
            } else {
                setGroups([])
            }
        }
    }

    const saveHistory = async () => {
        if (post && session.username) {
            await functions.post("/api/post/view", {postID: post.postID}, session, setSessionFlag)
        }
    }

    useEffect(() => {
        const updatePost = async () => {
            if (post) {
                const title = post.translatedTitle ? functions.toProperCase(post.translatedTitle) : 
                              post.title ? post.title : "Post"
                document.title = `${title}`
                if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
            }
        }
        updatePost()
        updateParent()
        updateChildren()
        updateGroups()
        saveHistory()
    }, [post, session])

    useEffect(() => {
        if (!session.cookie) return
        const updateArtistPosts = async () => {
            if (!tagCategories?.artists?.[0]?.tag || !post) return
            try {
                if (tagCategories.artists[0].tag === "unknown-artist") return
                let artistPosts = await functions.get("/api/search/posts", {query: tagCategories.artists[0].tag, type: "all", restrict: "all", style: "all", sort: "posted", limit: mobile ? 10 : 100}, session, setSessionFlag)
                artistPosts = artistPosts.filter((p: any) => p.postID !== postID)
                if (artistPosts?.length) setArtistPosts(artistPosts)
            } catch (err) {
                console.log(err)
            }
        }
        const updateRelatedPosts = async () => {
            if (!tagCategories?.characters?.[0]?.tag || !post) return
            if (tagCategories?.characters?.[0]?.tag !== characterTag) {
                try {
                    let relatedPosts = await functions.get("/api/search/posts", {query: tagCategories.characters[0].tag, type: post.type, restrict: post.restrict === "explicit" ? "explicit" : "all", style: post.style, sort: Math.random() > 0.5 ? "date" : "reverse date", limit: mobile ? 10 : 30}, session, setSessionFlag)
                    relatedPosts = relatedPosts.filter((p: any) => p.postID !== postID)
                    if (relatedPosts?.length) setRelatedPosts(relatedPosts)
                    characterTag = tagCategories.characters[0].tag
                } catch (err) {
                    console.log(err)
                }
            }
        }
        if (session.showRelated) {
            updateArtistPosts()
            updateRelatedPosts()
        }
    }, [session, post, tagCategories])

    useEffect(() => {
        const updateHistory = async () => {
            const historyPost = await functions.get("/api/post/history", {postID, historyID}, session, setSessionFlag)
            if (!historyPost) return functions.replaceLocation("/404")
            let images = historyPost.images.map((i: any) => functions.getHistoryImageLink(i))
            setImages(images)
            if (images[order-1]) {
                setImage(images[order-1])
            } else {
                setImage(images[0])
                setOrder(1)
            }
            const allTags = [...historyPost.artists, ...historyPost.characters, ...historyPost.series, ...historyPost.tags]
            const tags = await functions.get("/api/tag/counts", {tags: allTags}, session, setSessionFlag)
            const categories = await functions.tagCategories(tags, session, setSessionFlag)
            setTagCategories(categories)
            setTags(tags)
            setPost(historyPost)
        }
        if (historyID) updateHistory()
    }, [postID, historyID, order, session])

    useEffect(() => {
        const historyParam = new URLSearchParams(window.location.search).get("history")
        if (historyParam) return
        const updatePost = async () => {
            setLoaded(false)
            let post = posts.find((p: any) => p.postID === postID)
            try {
                if (!post) post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (err: any) {
                if (err.response?.status === 404) functions.replaceLocation("/404")
                if (err.response?.status === 403) functions.replaceLocation("/403")
                return
            }
            if (post) {
                /*
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
                } else {
                    images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                }
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }*/
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                if (!post.tags) {
                    try {
                        post = await functions.get("/api/post", {postID}, session, setSessionFlag)
                        setPost(post)
                    } catch (err: any) {
                        if (err.response?.status === 404) functions.replaceLocation("/404")
                        if (err.response?.status === 403) functions.replaceLocation("/403")
                        return
                    }
                }
                localStorage.setItem("savedPost", JSON.stringify(post))
                localStorage.setItem("savedTags", JSON.stringify(categories))
                setSessionFlag(true)
            } else {
                functions.replaceLocation("/404")
            }
        }
        updatePost()
    }, [postID, posts, order])

    useEffect(() => {
        if (post) {
            let images = [] as string[]
            if (session.upscaledImages) {
                images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
            } else {
                images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
            }
            setImages(images)
            if (images[order-1]) {
                setImage(images[order-1])
            } else {
                setImage(images[0])
                setOrder(1)
            }
            if (restrictType === "explicit") {
                if (post.restrict !== "explicit") setRestrictType("all")
            } else {
                if (post.restrict === "explicit") setRestrictType("explicit")
            }
        }
    }, [post, restrictType, order, session.upscaledImages])

    useEffect(() => {
        const historyParam = new URLSearchParams(window.location.search).get("history")
        if (historyParam) return
        const updatePost = async () => {
            setLoaded(false)
            setPostFlag(false)
            let post = null as any
            try {
                post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            } catch (err: any) {
                if (err.response?.status === 404) functions.replaceLocation("/404")
                if (err.response?.status === 403) functions.replaceLocation("/403")
                return
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.upscaledFilename || i.filename))
                } else {
                    images = post.images.map((i: any) => functions.getImageLink(i.type, post.postID, i.order, i.filename))
                }
                setImages(images)
                if (images[order-1]) {
                    setImage(images[order-1])
                } else {
                    setImage(images[0])
                    setOrder(1)
                }
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                localStorage.setItem("savedPost", JSON.stringify(post))
                localStorage.setItem("savedTags", JSON.stringify(categories))
                setSessionFlag(true)
            } else {
                functions.replaceLocation("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, order, session])

    const download = () => {
        setDownloadIDs([postID])
        setDownloadFlag(true)
    }

    const next = async () => {
        let currentIndex = posts.findIndex((p: any) => String(p.postID) === String(postID))
        if (currentIndex !== -1) {
            currentIndex++
            if (!session.username) {
                while (posts[currentIndex]?.restrict !== "safe") {
                    currentIndex++
                    if (currentIndex >= posts.length) break
                }
            }
            if (restrictType !== "explicit") {
                while (posts[currentIndex]?.restrict === "explicit") {
                    currentIndex++
                    if (currentIndex >= posts.length) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                history.push(`/post/${post.postID}/${post.slug}`)
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight() + 20)
            }
        }
    }

    const previous = async () => {
        let currentIndex = posts.findIndex((p: any) => String(p.postID) === String(postID))
        if (currentIndex !== -1) {
            currentIndex--
            if (!session.username) {
                while (posts[currentIndex]?.restrict !== "safe") {
                    currentIndex--
                    if (currentIndex <= -1) break
                }
            }
            if (restrictType !== "explicit") {
                while (posts[currentIndex]?.restrict === "explicit") {
                    currentIndex--
                    if (currentIndex <= -1) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                history.push(`/post/${post.postID}/${post.slug}`)
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight() + 20)
            }
        }
    }

    const set = (image: string, index: number) => {
        setImage(image)
        setOrder(index + 1)
    }

    const nsfwChecker = () => {
        if (!post) return false
        if (post.postID !== postID) return false
        if (post.restrict !== "safe") {
            if (loaded) return true
            return false
        } else {
            return true
        }
    }

    const revertTranslationHistory = async () => {
        const translation = await functions.get("/api/translation/history", {postID: post.postID, historyID: translationID}, session, setSessionFlag).then((r) => r[0])
        await functions.put("/api/translation/save", {postID: translation.postID, order: translation.order, data: translation.data}, session, setSessionFlag)
        currentHistory()
    }

    useEffect(() => {
        if (revertTranslationHistoryFlag && translationID === revertTranslationHistoryID?.historyID) {
            revertTranslationHistory().then(() => {
                setRevertTranslationHistoryFlag(false)
                setRevertTranslationHistoryID(null)
            }).catch(() => {
                setRevertTranslationHistoryFlag(false)
                setRevertTranslationHistoryID({failed: true, historyID: translationID})
            })
        }
    }, [revertTranslationHistoryFlag, revertTranslationHistoryID, translationID, post, session])

    const revertTranslationHistoryDialog = async () => {
        if (post.locked && !permissions.isMod(session)) return setRevertTranslationHistoryID({failed: "locked", historyID: translationID})
        setRevertTranslationHistoryID({failed: false, historyID: translationID})
    }

    const revertPostHistory = async () => {
        let currentPost = await functions.get("/api/post", {postID}, session, setSessionFlag)
        if (post.artists) {
            let categories = await functions.tagCategories(currentPost.tags, session, setSessionFlag)
            currentPost.artists = categories.artists.map((a: any) => a.tag)
            currentPost.characters = categories.characters.map((c: any) => c.tag)
            currentPost.series = categories.series.map((s: any) => s.tag)
            currentPost.tags = categories.tags.map((t: any) => t.tag)
        }
        const imgChanged = await functions.imagesChanged(post, currentPost, session)
        const tagsChanged = functions.tagsChanged(post, currentPost)
        const srcChanged = functions.sourceChanged(post, currentPost)
        let source = undefined as any
        if (imgChanged || srcChanged) {
            source = {
                title: post.title,
                translatedTitle: post.translatedTitle,
                artist: post.artist,
                posted: post.posted ? functions.formatDate(new Date(post.posted), true) : "",
                link: post.link,
                commentary: post.commentary,
                translatedCommentary: post.translatedCommentary,
                bookmarks: post.bookmarks,
                purchaseLink: post.purchaseLink,
                mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : ""
            }
        }
        if (imgChanged || (srcChanged && tagsChanged)) {
            if (imgChanged && !permissions.isMod(session)) return Promise.reject("img")
            const {images, upscaledImages} = await functions.parseImages(post, session)
            const newTags = await functions.parseNewTags(post, session, setSessionFlag)
            await functions.put("/api/post/edit", {postID: post.postID, images, upscaledImages, type: post.type, restrict: post.restrict, source,
            style: post.style, artists: post.artists, characters: post.characters, preserveChildren: Boolean(post.parentID),
            series: post.series, tags: post.tags, newTags, reason: post.reason}, session, setSessionFlag)
        } else {
            await functions.put("/api/post/quickedit", {postID: post.postID, type: post.type, restrict: post.restrict, source,
            style: post.style, artists: post.artists, characters: post.characters, preserveChildren: Boolean(post.parentID),
            series: post.series, tags: post.tags, reason: post.reason}, session, setSessionFlag)
        }
        currentHistory()
    }

    useEffect(() => {
        if (revertPostHistoryFlag && historyID === revertPostHistoryID?.historyID) {
            revertPostHistory().then(() => {
                setRevertPostHistoryFlag(false)
                setRevertPostHistoryID(null)
            }).catch((error) => {
                setRevertPostHistoryFlag(false)
                setRevertPostHistoryID({failed: error ? error : true, historyID})
            })
        }
    }, [revertPostHistoryFlag, revertPostHistoryID, historyID, post, session])

    const revertPostHistoryDialog = async () => {
        if (post.locked && !permissions.isMod(session)) return setRevertPostHistoryID({failed: "locked", historyID})
        setRevertPostHistoryID({failed: false, historyID})
    }

    const currentHistory = () => {
        setHistoryID(null)
        setTranslationID(null)
        setPostFlag(true)
        history.push(slug ? `/post/${postID}/${slug}` : `/post/${postID}`)
    }

    const getHistoryButtons = () => {
        if (translationID) {
            return (
                <div className="translation-button-container">
                    <button className="translation-button" onClick={() => history.push(`/translation/history/${postID}/${order}`)}>
                        <img src={historyIcon}/>
                        <span>History</span>
                    </button>
                    {session.username ? <button className="translation-button" onClick={revertTranslationHistoryDialog}>
                        <span>⌫Revert</span>
                    </button> : null}
                    <button className="translation-button" onClick={currentHistory}>
                        <img src={currentIcon}/>
                        <span>Current</span>
                    </button>
                </div>
            )
        }
        return (
            <div className="history-button-container">
                <button className="history-button" onClick={() => history.push(`/post/history/${postID}`)}>
                    <img src={historyIcon}/>
                    <span>History</span>
                </button>
                {session.username ? <button className="history-button" onClick={revertPostHistoryDialog}>
                    <span>⌫Revert</span>
                </button> : null}
                <button className="history-button" onClick={currentHistory}>
                    <img src={currentIcon}/>
                    <span>Current</span>
                </button>
            </div>
        )
    }

    const generateActiveFavgroupJSX = () => {
        if (activeFavgroup) {
            if (activeFavgroup.restrict === "explicit") if (restrictType !== "explicit") return null
            const images = activeFavgroup.posts.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
            const setGroup = (img: string, index: number) => {
                const postID = activeFavgroup.posts[index].postID
                history.push(slug ? `/post/${postID}/${slug}` : `/post/${postID}`)
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
            }
            return (
                <div className="post-item">
                    <div className="post-item-title-clickable" onClick={() => history.push(`/favgroup/${activeFavgroup.username}/${activeFavgroup.slug}`)}>{activeFavgroup.name}</div>
                    <div className="post-item-container">
                        <Carousel images={images} set={setGroup} noKey={true} marginTop={0}/>
                    </div>
                </div>
            )

        }
        return null
    }

    const generateGroupsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i]
            if (group.restrict === "explicit") if (restrictType !== "explicit") continue
            const images = group.posts.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
            const setGroup = (img: string, index: number) => {
                const postID = group.posts[index].postID
                history.push(slug ? `/post/${postID}/${slug}` : `/post/${postID}`)
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
                setPosts(group.posts)
                setTimeout(() => {
                    setActiveGroup(group.name)
                }, 200)
            }
            jsx.push(
                // style={{margin: "0px", paddingLeft: "60px", paddingRight: "60px", paddingTop: "0px", paddingBottom: "0px"}}
                // style={{marginTop: "0px", marginBottom: "10px"}} 
                <div className="post-item">
                    <div className="post-item-title-clickable" onClick={() => history.push(`/group/${group.slug}`)}>{group.name}</div>
                    <div className="post-item-container">
                        <Carousel images={images} set={setGroup} noKey={true} marginTop={0}/>
                    </div>
                </div>
            )
        }
        return jsx
    }

    const getPostJSX = () => {
        if (!post) return
        if (post.type === "model") {
            return (
                <>
                <PostModel post={post} model={image} order={order} next={next} previous={previous} translationID={translationID}/>
                <PostImageOptions post={post} model={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "audio") {
            return (
                <>
                <PostSong post={post} audio={image} order={order} next={next} previous={previous} translationID={translationID}/>
                <PostImageOptions post={post} audio={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else {
            let img = image
            if (session.cookie) {
                img += `?upscaled=${session.upscaledImages}`
            }
            return (
                <>
                <PostImage post={post} img={img} comicPages={post.type === "comic" ? images : null} order={order} next={next} previous={previous} translationID={translationID}/>
                <PostImageOptions post={post} img={img} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                </>
            )
        }
    }
    
    return (
        <>
        <CaptchaDialog/>
        <TagEditDialog/>
        <SourceEditDialog/>
        <FavgroupDialog/>
        <GroupDialog/>
        <ParentDialog/>
        <OCRDialog/>
        <EditCommentDialog/>
        <DeleteCommentDialog/>
        <ReportCommentDialog/>
        <RevertPostHistoryDialog/>
        <RevertTranslationHistoryDialog/>
        {post ? <DeletePostDialog post={post}/> : null}
        {post ? <PrivatePostDialog post={post}/> : null}
        {post ? <LockPostDialog post={post}/> : null}
        {post ? <TakedownPostDialog post={post}/> : null}
        {post ? <SaveTranslationDialog post={post}/> : null}
        <EditTranslationDialog/>
        <TitleBar post={post} goBack={true} historyID={historyID} translationID={translationID}/>
        <NavBar goBack={true}/>
        <div className="body">
            {post && tagCategories ? 
            <SideBar post={post} order={order} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : 
            <SideBar/>}
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {historyID || translationID ? getHistoryButtons() : null}
                    {/*nsfwChecker() &&*/ images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {/*nsfwChecker() &&*/ post ? getPostJSX() : null}
                    {generateActiveFavgroupJSX()}
                    {generateGroupsJSX()}
                    {parentPost ? <Parent post={parentPost}/>: null}
                    {childPosts.length ? <Children posts={childPosts}/> : null}
                    {mobile && post && tagCategories ? <MobileInfo post={post} order={order} artists={tagCategories.artists} characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags}/> : null}
                    {session.username && !session.banned && post ? <CutenessMeter post={post}/> : null}
                    {post?.purchaseLink ? <BuyLink link={post.purchaseLink}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.translatedCommentary}/> : null}
                    {artistPosts.length ? <ArtistWorks posts={artistPosts}/> : null}
                    {relatedPosts.length ? <Related related={relatedPosts}/> : null}
                    {post ? <Comments post={post}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage