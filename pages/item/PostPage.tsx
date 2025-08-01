import React, {useEffect, useContext, useState, useReducer} from "react"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import PostImage from "../../components/image/PostImage"
import PostModel from "../../components/image/PostModel"
import PostLive2D from "../../components/image/PostLive2D"
import PostSong from "../../components/image/PostSong"
import PostImageOptions from "../../components/post/PostImageOptions"
import CutenessMeter from "../../components/post/CutenessMeter"
import Comments from "../../components/post/Comments"
import Commentary from "../../components/post/Commentary"
import BuyLink from "../../components/post/BuyLink"
import functions from "../../structures/Functions"
import Carousel from "../../components/site/Carousel"
import Parent from "../../components/post/Parent"
import Children from "../../components/post/Children"
import ArtistWorks from "../../components/post/ArtistWorks"
import Related from "../../components/post/Related"
import MobileInfo from "../../components/site/MobileInfo"
import AdBanner from "../../components/post/AdBanner"
import historyIcon from "../../assets/icons/history-state.png"
import currentIcon from "../../assets/icons/current.png"
import {useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions, 
useLayoutSelector, useSearchSelector, useFlagSelector, useCacheActions, usePostDialogActions, 
useNoteDialogSelector, useNoteDialogActions, useActiveSelector, usePostDialogSelector,
useCacheSelector, useInteractionActions, useThemeSelector,
useSearchActions} from "../../store"
import permissions from "../../structures/Permissions"
import "./styles/postpage.less"
import {PostSearch, ChildPost, PostHistory, GroupPosts, SourceData, Image} from "../../types/Types"

const PostPage: React.FunctionComponent = () => {
    const {language, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {activeFavgroup} = useActiveSelector()
    const {setHeaderText, setSidebarText, setActiveGroup} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {ratingType} = useSearchSelector()
    const {setRatingType} = useSearchActions()
    const {posts, post, tagCategories, tagGroupCategories, order} = useCacheSelector()
    const {setPosts, setTags, setPost, setTagCategories, setTagGroupCategories, setOrder} = useCacheActions()
    const {postFlag} = useFlagSelector()
    const {setReloadPostFlag, setRedirect, setPostFlag, setDownloadIDs, setDownloadFlag} = useFlagActions()
    const {revertPostHistoryID, revertPostHistoryFlag} = usePostDialogSelector()
    const {setRevertPostHistoryID, setRevertPostHistoryFlag} = usePostDialogActions()
    const {revertNoteHistoryID, revertNoteHistoryFlag} = useNoteDialogSelector()
    const {setRevertNoteHistoryID, setRevertNoteHistoryFlag} = useNoteDialogActions()
    const [images, setImages] = useState([] as string[])
    const [childPosts, setChildPosts] = useState([] as ChildPost[])
    const [artistPosts, setArtistPosts] = useState([] as PostSearch[])
    const [relatedPosts, setRelatedPosts] = useState([] as PostSearch[])
    const [parentPost, setParentPost] = useState(null as ChildPost | null)
    const [loaded, setLoaded] = useState(false)
    const [image, setImage] = useState("")
    const [historyID, setHistoryID] = useState(null as string | null)
    const [noteID, setNoteID] = useState(null as string | null)
    const [groups, setGroups] = useState([] as GroupPosts[])
    const navigate = useNavigate()
    const location = useLocation()
    const {id: postID, slug} = useParams() as {id: string, slug: string}

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
        const noteParam = new URLSearchParams(window.location.search).get("note")
        setNoteID(noteParam)
        const orderParam = new URLSearchParams(window.location.search).get("order")
        if (orderParam) setOrder(Number(orderParam))
    }, [location])

    useEffect(() => {
        if (!session.cookie) return
        functions.processRedirects(post, postID, slug, history, session, setSessionFlag)
    }, [post, session])

    useEffect(() => {
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
                navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
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
            setRedirect(`/post/${postID}/${slug}`)
        }
        if (!session.username && post.rating !== functions.r13()) {
            navigate("/login")
            setSidebarText("Login required.")
        }
        if (post.deleted && !permissions.isMod(session)) {
            return functions.replaceLocation("/403")
        }
        if (functions.isR18(post.rating)) {
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
        updateParent()
        updateChildren()
        updateGroups()
        saveHistory()
    }, [post, session])

    useEffect(() => {
        const updateTitle = async () => {
            if (!post) return
            let title = ""
            if (language === "ja") {
                title = post.title ? post.title : "Post"
            } else {
                title = post.englishTitle ? functions.toProperCase(post.englishTitle) : 
                post.title ? post.title : "Post"
            }
            document.title = `${title}`
            if (title !== "Post") setHeaderText(title.replaceAll("-", " "))
        }
        updateTitle()
    }, [post, language])

    useEffect(() => {
        if (!session.cookie) return
        const updateArtistPosts = async () => {
            if (!tagCategories?.artists?.[0]?.tag || !post) return
            try {
                if (tagCategories.artists[0].tag === "unknown-artist") return
                let artistPosts = await functions.get("/api/search/posts", {query: tagCategories.artists[0].tag, type: "all", rating: "all", style: "all", sort: "posted", limit: mobile ? 10 : 100}, session, setSessionFlag)
                artistPosts = artistPosts.filter((p) => p.postID !== postID)
                if (artistPosts?.length) setArtistPosts(artistPosts)
            } catch (err) {
                console.log(err)
            }
        }
        if (!session.username || session.showRelated) {
            updateArtistPosts()
        }
    }, [session, post, tagCategories])

    useEffect(() => {
        const updateHistory = async () => {
            if (!historyID) return
            const historyPost = await functions.get("/api/post/history", {postID, historyID}, session, setSessionFlag).then((r) => r[0])
            if (!historyPost) return functions.replaceLocation("/404")
            let images = [] as string[]
            if (session.upscaledImages && historyPost.upscaledImages?.length) {
                images = historyPost.upscaledImages.map((i) => functions.getHistoryImageLink(i))
            } else {
                images = historyPost.images.map((i) => functions.getHistoryImageLink(i))
            }
            setImages(images)
            if (images[order-1]) {
                setImage(images[order-1])
            } else {
                setImage(images[0])
                setOrder(1)
            }
            const allTags = [...historyPost.artists, ...historyPost.characters, ...historyPost.series, ...historyPost.tags]
            const tags = await functions.tagCountsCache(allTags, session, setSessionFlag)
            const categories = await functions.tagCategories(tags, session, setSessionFlag)
            const groupCategories = await functions.tagGroupCategories(historyPost.tagGroups, session, setSessionFlag)
            setTagGroupCategories(groupCategories)
            setTagCategories(categories)
            setTags(tags)
            setPost(historyPost)
        }
        updateHistory()
    }, [postID, historyID, order, session])

    useEffect(() => {
        setImage("")
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        const historyParam = new URLSearchParams(window.location.search).get("history")
        if (historyParam) return
        const updatePost = async () => {
            setLoaded(false)
            let post = posts.find((p) => p.postID === postID) as PostSearch | undefined
            try {
                if (!post) post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch | undefined
            } catch (err: any) {
                if (err.response?.status === 404) functions.replaceLocation("/404")
                if (err.response?.status === 403) functions.replaceLocation("/403")
                return
            }
            if (post) {
                const tags = await functions.parseTags([post], session, setSessionFlag)
                const categories = await functions.tagCategories(tags, session, setSessionFlag)
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                if (!post.tags) {
                    try {
                        post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch | undefined
                        if (post) setPost(post)
                    } catch (err: any) {
                        if (err.response?.status === 404) functions.replaceLocation("/404")
                        if (err.response?.status === 403) functions.replaceLocation("/403")
                        return
                    }
                }
                setSessionFlag(true)
            } else {
                //functions.replaceLocation("/404")
            }
        }
        updatePost()
    }, [postID, posts, order])

    useEffect(() => {
        if (post) {
            let images = [] as string[]
            if (session.upscaledImages) {
                let upscaledImages = post.upscaledImages || post.images
                images = upscaledImages.map((i: Image | string) => typeof i === "string" ? 
                functions.getRawImageLink(i) : functions.getImageLink(i, true))
            } else {
                images = post.images.map((i: Image | string) => typeof i === "string" ? 
                functions.getRawImageLink(i) : functions.getImageLink(i))
            }
            setImages(images)
            if (images[order-1]) {
                setImage(images[order-1])
            } else {
                setImage(images[0])
                setOrder(1)
            }
            /*
            if (functions.isR18(ratingType)) {
                if (!functions.isR18(post.rating)) setRatingType("all")
            } else {
                if (functions.isR18(post.rating)) setRatingType(functions.r18())
            }*/
        }
    }, [post, order, session.upscaledImages])

    useEffect(() => {
        const historyParam = new URLSearchParams(window.location.search).get("history")
        if (historyParam) return
        const updatePost = async () => {
            setLoaded(false)
            setPostFlag(false)
            let post = null as PostSearch | null
            try {
                post = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch | null
            } catch (err: any) {
                if (err.response?.status === 404) functions.replaceLocation("/404")
                if (err.response?.status === 403) functions.replaceLocation("/403")
                return
            }
            if (post) {
                let images = [] as string[]
                if (session.upscaledImages) {
                    images = post.images.map((image) => functions.getImageLink(image, true))
                } else {
                    images = post.images.map((image) => functions.getImageLink(image))
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
                const groupCategories = await functions.tagGroupCategories(post.tagGroups, session, setSessionFlag)
                setTagGroupCategories(groupCategories)
                setTagCategories(categories)
                setTags(tags)
                setPost(post)
                setSessionFlag(true)
            } else {
                //functions.replaceLocation("/404")
            }
        }
        if (postFlag) updatePost()
    }, [postFlag, order, session])

    const download = () => {
        setDownloadIDs([postID])
        setDownloadFlag(true)
    }

    const next = async () => {
        let currentIndex = posts.findIndex((p) => String(p.postID) === String(postID))
        if (currentIndex !== -1) {
            currentIndex++
            if (!session.username) {
                while (posts[currentIndex]?.rating !== functions.r13()) {
                    currentIndex++
                    if (currentIndex >= posts.length) break
                }
            }
            if (!functions.isR18(ratingType)) {
                while (functions.isR18(posts[currentIndex]?.rating)) {
                    currentIndex++
                    if (currentIndex >= posts.length) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                navigate(`/post/${post.postID}/${post.slug}`)
            }
        }
    }

    const previous = async () => {
        let currentIndex = posts.findIndex((p) => String(p.postID) === String(postID))
        if (currentIndex !== -1) {
            currentIndex--
            if (!session.username) {
                while (posts[currentIndex]?.rating !== functions.r13()) {
                    currentIndex--
                    if (currentIndex <= -1) break
                }
            }
            if (!functions.isR18(ratingType)) {
                while (functions.isR18(posts[currentIndex]?.rating)) {
                    currentIndex--
                    if (currentIndex <= -1) break
                }
            }
            if (posts[currentIndex]) {
                const post = posts[currentIndex]
                if (post.fake) return
                navigate(`/post/${post.postID}/${post.slug}`)
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
        if (post.rating !== functions.r13()) {
            if (loaded) return true
            return false
        } else {
            return true
        }
    }

    const revertNoteHistory = async () => {
        if (!post || !noteID) return
        const note = await functions.get("/api/note/history", {postID: post.postID, historyID: noteID}, session, setSessionFlag).then((r) => r[0])
        await functions.put("/api/note/save", {postID: note.postID, order: note.order, data: note.notes}, session, setSessionFlag)
        currentHistory()
    }

    useEffect(() => {
        if (revertNoteHistoryFlag && noteID === revertNoteHistoryID?.historyID) {
            revertNoteHistory().then(() => {
                setRevertNoteHistoryFlag(false)
                setRevertNoteHistoryID(null)
            }).catch(() => {
                setRevertNoteHistoryFlag(false)
                setRevertNoteHistoryID({failed: true, historyID: noteID})
            })
        }
    }, [revertNoteHistoryFlag, revertNoteHistoryID, noteID, post, session])

    const revertNoteHistoryDialog = async () => {
        if (!post) return
        const postObject = await functions.get("/api/post", {postID: post.postID}, session, setSessionFlag)
        if (postObject?.locked && !permissions.isMod(session)) return setRevertNoteHistoryID({failed: "locked", historyID: noteID})
        setRevertNoteHistoryID({failed: false, historyID: noteID})
    }

    const revertPostHistory = async () => {
        if (!post) return
        const historyPost = post as PostHistory
        let currentPost = await functions.get("/api/post", {postID}, session, setSessionFlag) as PostSearch
        if (historyPost.artists) {
            let categories = await functions.tagCategories(currentPost.tags, session, setSessionFlag)
            currentPost.artists = categories.artists.map((a) => a.tag)
            currentPost.characters = categories.characters.map((c) => c.tag)
            currentPost.series = categories.series.map((s) => s.tag)
            currentPost.tags = [...categories.tags.map((t) => t.tag), ...categories.meta.map((m) => m.tag)]
        }
        const imgChanged = await functions.imagesChanged(post, currentPost, session)
        const tagsChanged = functions.tagsChanged(post, currentPost)
        const srcChanged = functions.sourceChanged(post, currentPost)
        let source = undefined as SourceData | undefined
        if (imgChanged || srcChanged) {
            source = {
                title: post.title,
                englishTitle: post.englishTitle,
                artist: post.artist,
                posted: post.posted ? functions.formatDate(new Date(post.posted), true) : "",
                source: post.source,
                commentary: post.commentary,
                englishCommentary: post.englishCommentary,
                bookmarks: post.bookmarks,
                buyLink: post.buyLink,
                mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : ""
            }
        }
        if (imgChanged || (srcChanged && tagsChanged)) {
            if (imgChanged && !permissions.isMod(session)) return Promise.reject("img")
            const {images, upscaledImages} = await functions.parseImages(post, session)
            const newTags = await functions.parseNewTags(post, session, setSessionFlag)

            await functions.put("/api/post/edit", {postID: post.postID, images, upscaledImages, type: post.type, rating: post.rating, source: source as SourceData,
            style: post.style, artists: functions.tagObject(historyPost.artists), characters: functions.tagObject(historyPost.characters), noImageUpdate: true,
            preserveChildren: Boolean(post.parentID), series: functions.tagObject(historyPost.series), tags: post.tags, tagGroups: post.tagGroups, newTags, 
            reason: historyPost.reason}, session, setSessionFlag)
        } else {
            await functions.put("/api/post/quickedit", {postID: post.postID, type: post.type, rating: post.rating, source,
            style: post.style, artists: historyPost.artists, characters: historyPost.characters, series: historyPost.series, tags: post.tags, 
            tagGroups: historyPost.tagGroups, reason: historyPost.reason}, session, setSessionFlag)
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
        if (!post) return
        const postObject = await functions.get("/api/post", {postID: post.postID}, session, setSessionFlag)
        if (postObject?.locked && !permissions.isMod(session)) return setRevertPostHistoryID({failed: "locked", historyID})
        setRevertPostHistoryID({failed: false, historyID})
    }

    const currentHistory = () => {
        setHistoryID(null)
        setNoteID(null)
        setPostFlag(true)
        navigate(`/post/${postID}/${slug}`)
    }

    const getHistoryButtons = () => {
        if (noteID) {
            return (
                <div className="note-button-container">
                    <button className="note-button" onClick={() => navigate(`/note/history/${postID}/${slug}/${order}`)}>
                        <img src={historyIcon}/>
                        <span>History</span>
                    </button>
                    {session.username ? <button className="note-button" onClick={revertNoteHistoryDialog}>
                        <span>⌫Revert</span>
                    </button> : null}
                    <button className="note-button" onClick={currentHistory}>
                        <img src={currentIcon}/>
                        <span>Current</span>
                    </button>
                </div>
            )
        }
        return (
            <div className="history-button-container">
                <button className="history-button" onClick={() => navigate(`/post/history/${postID}/${slug}`)}>
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
            if (functions.isR18(activeFavgroup.rating)) if (!session.showR18) return null
            const images = activeFavgroup.posts.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
            const setGroup = (img: string, index: number) => {
                const postID = activeFavgroup.posts[index].postID
                navigate(`/post/${postID}/${slug}`)
            }
            return (
                <div className="post-item">
                    <div className="post-item-title-clickable" onClick={() => navigate(`/favgroup/${activeFavgroup.username}/${activeFavgroup.slug}`)}>{i18n.post.favgroup}: {activeFavgroup.name}</div>
                    <div className="post-item-container">
                        <Carousel images={images} set={setGroup} noKey={true} marginTop={0}/>
                    </div>
                </div>
            )

        }
        return null
    }

    const generateGroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i]
            if (functions.isR18(group.rating)) if (!session.showR18) continue
            const images = group.posts.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
            const setGroup = (img: string, index: number) => {
                const postID = group.posts[index].postID
                navigate(`/post/${postID}/${slug}`)
                setPosts(group.posts)
                setTimeout(() => {
                    setActiveGroup(group)
                }, 200)
            }
            jsx.push(
                // style={{margin: "0px", paddingLeft: "60px", paddingRight: "60px", paddingTop: "0px", paddingBottom: "0px"}}
                // style={{marginTop: "0px", marginBottom: "10px"}} 
                <div className="post-item">
                    <div className="post-item-title-clickable" onClick={() => navigate(`/group/${group.slug}`)}>{i18n.labels.group}: {group.name}</div>
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
                <PostModel post={post} model={image} order={order} next={next} previous={previous} noteID={noteID}/>
                <PostImageOptions post={post} model={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "live2d") {
            return (
                <>
                <PostLive2D post={post} live2d={image} order={order} next={next} previous={previous} noteID={noteID}/>
                <PostImageOptions post={post} live2d={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else if (post.type === "audio") {
            return (
                <>
                <PostSong post={post} audio={image} order={order} next={next} previous={previous} noteID={noteID} artists={tagCategories?.artists}/>
                <PostImageOptions post={post} audio={image} download={download} next={next} previous={previous}/>
                </>
            )
        } else {
            let img = image
            if (session.cookie) {
                if (img) img = functions.appendURLParams(img, {upscaled: session.upscaledImages})
            }
            return (
                <>
                <PostImage post={post} img={img} comicPages={post.type === "comic" ? images : null} order={order} next={next} previous={previous} noteID={noteID} artists={tagCategories?.artists}/>
                <PostImageOptions post={post} img={img} comicPages={post.type === "comic" ? images : null} download={download} next={next} previous={previous}/>
                </>
            )
        }
    }
    
    return (
        <>
        <TitleBar post={post} goBack={true} historyID={historyID} noteID={noteID}/>
        <NavBar goBack={true}/>
        <div className="body">
            <SideBar post={post} order={order} artists={tagCategories?.artists} 
            characters={tagCategories?.characters} series={tagCategories?.series} 
            tags={tagCategories?.tags} meta={tagCategories?.meta} tagGroups={tagGroupCategories}/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-container">
                    {/* <AdBanner/> */}
                    {historyID || noteID ? getHistoryButtons() : null}
                    {post && images.length > 1 ?
                    <div className="carousel-container">
                        <Carousel images={images} set={set} index={order-1}/>
                    </div> : null}
                    {post ? getPostJSX() : null}
                    {generateActiveFavgroupJSX()}
                    {post && parentPost ? <Parent post={parentPost}/>: null}
                    {post && childPosts.length ? <Children posts={childPosts}/> : null}
                    {generateGroupsJSX()}
                    {mobile && post && tagCategories ? <MobileInfo post={post} order={order} artists={tagCategories.artists} 
                    characters={tagCategories.characters} series={tagCategories.series} tags={tagCategories.tags} 
                    meta={tagCategories?.meta} tagGroups={tagGroupCategories}/> : null}
                    {post && session.username && !session.banned ? <CutenessMeter post={post}/> : null}
                    {post?.buyLink ? <BuyLink link={post.buyLink}/> : null}
                    {post?.commentary ? <Commentary text={post.commentary} translated={post.englishCommentary}/> : null}
                    {post && artistPosts.length ? <ArtistWorks posts={artistPosts}/> : null}
                    {post ? <Comments post={post}/> : null}
                    {post && tagCategories ? <Related post={post} tag={tagCategories.characters[0]?.tag} 
                    fallback={[tagCategories.series[0]?.tag, tagCategories.artists[0]?.tag]}/> : null}
                    <Footer/>
                </div>
            </div>
        </div>
        </>
    )
}

export default PostPage