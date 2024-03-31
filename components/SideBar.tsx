import React, {useContext, useEffect, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, EnableDragContext, MobileContext, UnverifiedPostsContext,
RelativeContext, HideTitlebarContext, SidebarHoverContext, SearchContext, SearchFlagContext, PostsContext, ShowDeletePostDialogContext, AutoSearchContext,
TagsContext, RandomFlagContext, ImageSearchFlagContext, SidebarTextContext, SessionContext, MobileScrollingContext, QuickEditIDContext, QuickEditUnverifiedContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import searchIcon from "../assets/purple/search.png"
import searchMagenta from "../assets/magenta/search.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchIconHover from "../assets/purple/search-hover.png"
import searchMagentaHover from "../assets/magenta/search-hover.png"
import searchMagentaLightHover from "../assets/magenta-light/search-hover.png"
import searchPurpleLightHover from "../assets/purple-light/search-hover.png"
import searchImage from "../assets/purple/search-image.png"
import searchImageMagenta from "../assets/magenta/search-image.png"
import searchImagePurpleLight from "../assets/purple-light/search-image.png"
import searchImageMagentaLight from "../assets/magenta-light/search-image.png"
import searchImageHover from "../assets/purple/search-image-hover.png"
import searchImageMagentaHover from "../assets/magenta/search-image-hover.png"
import searchImagePurpleLightHover from "../assets/purple-light/search-image-hover.png"
import searchImageMagentaLightHover from "../assets/magenta-light/search-image-hover.png"
import random from "../assets/purple/random.png"
import randomMagenta from "../assets/magenta/random.png"
import randomPurpleLight from "../assets/purple-light/random.png"
import randomMagentaLight from "../assets/magenta-light/random.png"
import randomHover from "../assets/purple/random-hover.png"
import randomMagentaHover from "../assets/magenta/random-hover.png"
import randomPurpleLightHover from "../assets/purple-light/random-hover.png"
import randomMagentaLightHover from "../assets/magenta-light/random-hover.png"
import randomMobile from "../assets/purple/random-mobile.png"
import randomMobileMagenta from "../assets/magenta/random-mobile.png"
import randomMobilePurpleLight from "../assets/purple-light/random-mobile.png"
import randomMobileMagentaLight from "../assets/magenta-light/random-mobile.png"
import randomMobileHover from "../assets/purple/random-mobile-hover.png"
import randomMobileMagentaHover from "../assets/magenta/random-mobile-hover.png"
import randomMobilePurpleLightHover from "../assets/purple-light/random-mobile-hover.png"
import randomMobileMagentaLightHover from "../assets/magenta-light/random-mobile-hover.png"
import terms from "../assets/purple/terms.png"
import termsMagenta from "../assets/magenta/terms.png"
import termsPurpleLight from "../assets/purple-light/terms.png"
import termsMagentaLight from "../assets/magenta-light/terms.png"
import contact from "../assets/purple/contact.png"
import contactMagenta from "../assets/magenta/contact.png"
import contactPurpleLight from "../assets/purple-light/contact.png"
import contactMagentaLight from "../assets/magenta-light/contact.png"
import code from "../assets/purple/code.png"
import codeMagenta from "../assets/magenta/code.png"
import codePurpleLight from "../assets/purple-light/code.png"
import codeMagentaLight from "../assets/magenta-light/code.png"
import artistImg from "../assets/images/artist.png"
import setAvatar from "../assets/purple/setavatar.png"
import setAvatarMagenta from "../assets/magenta/setavatar.png"
import addTranslation from "../assets/purple/addtranslation.png"
import addTranslationMagenta from "../assets/magenta/addtranslation.png"
import report from "../assets/purple/report.png"
import reportMagenta from "../assets/magenta/report.png"
import quickEdit from "../assets/purple/quickedit.png"
import quickEditMagenta from "../assets/magenta/quickedit.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import historyIcon from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import rejectRed from "../assets/purple/reject-red.png"
import approveGreen from "../assets/purple/approve-green.png"
import tagIcon from "../assets/purple/tag.png"
import pack from "../package.json"
import functions from "../structures/Functions"
import axios from "axios"
import TagHover from "./TagHover"
import website from "../assets/purple/support.png"
import fandom from "../assets/purple/fandom.png"
import pixiv from "../assets/purple/pixiv.png"
import twitter from "../assets/purple/twitter.png"
import deviantart from "../assets/purple/deviantart.png"
import artstation from "../assets/purple/artstation.png"
import SearchSuggestions from "./SearchSuggestions"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import question from "../assets/purple/question.png"
import autoSearchIconPurple from "../assets/purple/autosearch.png"
import autoSearchActiveIconPurple from "../assets/purple/autosearch-active.png"
import autoSearchIconMagenta from "../assets/magenta/autosearch.png"
import autoSearchActiveIconMagenta from "../assets/magenta/autosearch-active.png"
import danbooru from "../assets/purple/danbooru.png"
import gelbooru from "../assets/purple/gelbooru.png"
import safebooru from "../assets/purple/safebooru.png"
import yandere from "../assets/purple/yandere.png"
import konachan from "../assets/purple/konachan.png"
import "./styles/sidebar.less"

interface Props {
    post?: any
    artists?: any 
    characters?: any 
    series?: any
    tags?: any
    unverified?: boolean
    noActions?: boolean
}

const maxTags1 = 26
const maxTags2 = 29
const maxTags3 = 31

const SideBar: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {sidebarHover, setSidebarHover} = useContext(SidebarHoverContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {unverifiedPosts, setUnverifiedPosts} = useContext(UnverifiedPostsContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {tags, setTags} = useContext(TagsContext)
    const {randomFlag, setRandomFlag} = useContext(RandomFlagContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {mobileScrolling, setMobileScrolling} = useContext(MobileScrollingContext)
    const {session, setSession} = useContext(SessionContext)
    const [maxTags, setMaxTags] = useState(maxTags1)
    const [uploaderImage, setUploaderImage] = useState("")
    const [uploaderRole, setUploaderRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const [getSearchImageIconHover, setSearchImageIconHover] = useState(false)
    const [getRandomIconHover, setRandomIconHover] = useState(false)
    const [getRandomMobileIconHover, setRandomMobileIconHover] = useState(false)
    const {quickEditID, setQuickEditID} = useContext(QuickEditIDContext)
    const {quickEditUnverified, setQuickEditUnverified} = useContext(QuickEditUnverifiedContext)
    const {autoSearch, setAutoSearch} = useContext(AutoSearchContext)
    const history = useHistory()

    const updateTags = async () => {
        const tags = await functions.parseTags(posts)
        setTags(tags)
    }

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const updateUserImg = async () => {
        if (props.post) {
            const uploader = await axios.get("/api/user", {params: {username: props.post.uploader}, withCredentials: true}).then((r) => r.data)
            setUploaderImage(uploader?.image ? functions.getTagLink("pfp", uploader.image) : getFavicon())
            if (uploader?.role) setUploaderRole(uploader.role)
            const updater = await axios.get("/api/user", {params: {username: props.post.updater}, withCredentials: true}).then((r) => r.data)
            if (updater?.role) setUpdaterRole(updater.role)
        }
    }

    useEffect(() => {
        updateTags()
        updateUserImg()

        const savedUploaderImage = localStorage.getItem("uploaderImage")
        if (savedUploaderImage) setUploaderImage(savedUploaderImage)
    }, [])

    useEffect(() => {
        functions.linkToBase64(uploaderImage).then((uploaderImage) => {
            localStorage.setItem("uploaderImage", uploaderImage)
        })
    }, [uploaderImage])

    useEffect(() => {
        updateUserImg()
    }, [props.post])

    useEffect(() => {
        updateTags()
    }, [posts])

    useEffect(() => {
        const scrollHandler = () => {
            const sidebar = document.querySelector(".sidebar") as HTMLElement
            const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
            if (!sidebar && !mobileSidebar) return
            if (mobile) {
                mobileSidebar.style.top = `${functions.titlebarHeight()}px`
                mobileSidebar.style.height = "auto"
                return
            }
            if (!sidebar) return
            if (!relative) {
                if (!hideTitlebar) {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxTags !== maxTags1) setMaxTags(maxTags1)
                } else {
                    if (window.scrollY !== 0) {
                        if (hideNavbar && window.scrollY > functions.titlebarHeight()) {
                            sidebar.style.top = "0px"
                            sidebar.style.height = "100vh"
                            if (maxTags !== maxTags3) setMaxTags(maxTags3)
                        } else {
                            sidebar.style.top = `${functions.navbarHeight()}px`
                            sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                            if (maxTags !== maxTags2) setMaxTags(maxTags2)
                        }
                    } else {
                        sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                        sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                        if (maxTags !== maxTags1) setMaxTags(maxTags1)
                    }
                }
            } else {
                sidebar.style.top = "0px"
                sidebar.style.height = "auto"
                if (maxTags !== maxTags3) setMaxTags(maxTags3)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            setTimeout(() => {
                window.removeEventListener("scroll", scrollHandler)
            }, 10)
        }
    })

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = `${functions.titlebarHeight()}px`
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideTitlebar) {
                sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                if (maxTags !== maxTags1) setMaxTags(maxTags1)
            } else {
                if (window.scrollY !== 0) {
                    if (hideNavbar && window.scrollY > functions.titlebarHeight()) {
                        sidebar.style.top = "0px"
                        sidebar.style.height = "100vh"
                        if (maxTags !== maxTags3) setMaxTags(maxTags3)
                    } else {
                        sidebar.style.top = `${functions.navbarHeight()}px`
                        sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                        if (maxTags !== maxTags2) setMaxTags(maxTags2)
                    }
                } else {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxTags !== maxTags1) setMaxTags(maxTags1)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== maxTags3) setMaxTags(maxTags3)
        }
    }, [hideTitlebar, relative, mobile])

    useEffect(() => {
        const sidebar = document.querySelector(".sidebar") as HTMLElement
        const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
        if (!sidebar && !mobileSidebar) return
        if (mobile) {
            mobileSidebar.style.top = `${functions.titlebarHeight()}px`
            mobileSidebar.style.height = "auto"
            return
        }
        if (!sidebar) return
        if (!relative) {
            if (!hideNavbar) {
                if (!hideTitlebar) {
                    sidebar.style.top = `${functions.navbarHeight() + functions.titlebarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px - ${functions.titlebarHeight()}px)`
                    if (maxTags !== maxTags1) setMaxTags(maxTags1)
                } else {
                    sidebar.style.top = `${functions.navbarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                    if (maxTags !== maxTags2) setMaxTags(maxTags2)
                }
                return
            }
            if (!hideSortbar) {
                if (sidebar.style.top === "0px") {
                    sidebar.style.top = `${functions.navbarHeight()}px`
                    sidebar.style.height = `calc(100vh - ${functions.navbarHeight()}px)`
                    if (maxTags !== maxTags2) setMaxTags(maxTags2)
                }
            } else {
                if (sidebar.style.top === `${functions.navbarHeight()}px`) {
                    sidebar.style.top = "0px"
                    sidebar.style.height = "100vh"
                    if (maxTags !== maxTags3) setMaxTags(maxTags3)
                }
            }
        } else {
            sidebar.style.top = "0px"
            sidebar.style.height = "auto"
            if (maxTags !== maxTags3) setMaxTags(maxTags3)
        }
    }, [hideSortbar, hideNavbar, hideTitlebar, mobile])

    const getSearchIcon = () => {
        if (theme === "purple") return getSearchIconHover ? searchIconHover : searchIcon
        if (theme === "purple-light") return getSearchIconHover ? searchPurpleLightHover : searchPurpleLight
        if (theme === "magenta") return getSearchIconHover ? searchMagentaHover : searchMagenta
        if (theme === "magenta-light") return getSearchIconHover ? searchMagentaLightHover : searchMagentaLight
        return getSearchIconHover ? searchIconHover : searchIcon
    }

    const getSearchImageIcon = () => {
        if (theme === "purple") return getSearchImageIconHover ? searchImageHover : searchImage
        if (theme === "purple-light") return getSearchImageIconHover ? searchImagePurpleLightHover : searchImagePurpleLight
        if (theme === "magenta") return getSearchImageIconHover ? searchImageMagentaHover : searchImageMagenta
        if (theme === "magenta-light") return getSearchImageIconHover ? searchImageMagentaLightHover : searchImageMagentaLight
        return getSearchImageIconHover ? searchImageHover : searchImage
    }

    const getRandomIcon = () => {
        if (theme === "purple") return getRandomIconHover ? randomHover : random
        if (theme === "purple-light") return getRandomIconHover ? randomPurpleLightHover : randomPurpleLight
        if (theme === "magenta") return getRandomIconHover ? randomMagentaHover : randomMagenta
        if (theme === "magenta-light") return getRandomIconHover ? randomMagentaLightHover : randomMagentaLight
        return getRandomIconHover ? randomHover : random
    }

    const getRandomMobileIcon = () => {
        if (theme === "purple") return getRandomMobileIconHover ? randomMobileHover : randomMobile
        if (theme === "purple-light") return getRandomMobileIconHover ? randomMobilePurpleLightHover : randomMobilePurpleLight
        if (theme === "magenta") return getRandomMobileIconHover ? randomMobileMagentaHover : randomMobileMagenta
        if (theme === "magenta-light") return getRandomMobileIconHover ? randomMobileMagentaLightHover : randomMobileMagentaLight
        return getRandomMobileIconHover ? randomMobileHover : randomMobile
    }

    const getTermsIcon = () => {
        if (theme === "purple") return terms
        if (theme === "purple-light") return termsPurpleLight
        if (theme === "magenta") return termsMagenta
        if (theme === "magenta-light") return termsMagentaLight
        return terms
    }

    const getContactIcon = () => {
        if (theme === "purple") return contact
        if (theme === "purple-light") return contactPurpleLight
        if (theme === "magenta") return contactMagenta
        if (theme === "magenta-light") return contactMagentaLight
        return contact
    }

    const getCodeIcon = () => {
        if (theme === "purple") return code
        if (theme === "purple-light") return codePurpleLight
        if (theme === "magenta") return codeMagenta
        if (theme === "magenta-light") return codeMagentaLight
        return code
    }

    const getSetAvatar = () => {
        if (theme.includes("magenta")) return setAvatarMagenta
        return setAvatar
    }

    const getQuickEdit = () => {
        if (theme.includes("magenta")) return quickEditMagenta
        return quickEdit
    }

    const getAddTranslation = () => {
        if (theme.includes("magenta")) return addTranslationMagenta
        return addTranslation
    }

    const getReport = () => {
        if (theme.includes("magenta")) return reportMagenta
        return report
    }

    const getEdit = () => {
        if (theme.includes("magenta")) return editMagenta
        return edit
    }

    const getShowTags = () => {
        return tagIcon
    }

    const getHistory = () => {
        if (theme.includes("magenta")) return historyMagenta
        return historyIcon
    }

    const getDeleteIcon = () => {
        if (theme.includes("magenta")) return deleteIconMagenta
        return deleteIcon
    }

    const getAutoSearch = () => {
        if (autoSearch) {
            if (theme.includes("magenta")) return autoSearchActiveIconMagenta
            return autoSearchActiveIconPurple
        } else {
            if (theme.includes("magenta")) return autoSearchIconMagenta
            return autoSearchIconPurple
        }
    }

    const tagInfo = (event: React.MouseEvent, tag: string) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${tag}`, "_blank")
        } else {
            history.push(`/tag/${tag}`)
        }
    }

    const generateArtistsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.artists.length; i++) {
            if (!props.artists[i]) break
            const link = functions.getTagLink("artist", props.artists[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.artists[i].tag)
                setSearchFlag(true)
            }
            const artistSocials = () => {
                let jsx = [] as any
                if (props.artists[i].website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(props.artists[i].website, "_blank")}/>)
                }
                if (props.artists[i].pixiv) {
                    jsx.push(<img className="sidebar-social" src={pixiv} onClick={() => window.open(props.artists[i].pixiv, "_blank")}/>)
                }
                if (props.artists[i].twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.artists[i].twitter, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                    {link ?
                    <div className="sidebar-row">
                        <img className="sidebar-img" src={link}/>
                    </div> : null}
                    <div className="sidebar-row">
                        <span className="tag-hover">
                            <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.artists[i].tag)} onAuxClick={(event) => tagInfo(event, props.artists[i].tag)}/>
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
            if (!props.characters[i]) break
            const link = functions.getTagLink("character", props.characters[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.characters[i].tag)
                setSearchFlag(true)
            }
            const characterSocials = () => {
                let jsx = [] as any 
                if (props.characters[i].fandom) {
                    jsx.push(<img className="sidebar-social" src={fandom} onClick={() => window.open(props.characters[i].fandom, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover">
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.characters[i].tag)} onAuxClick={(event) => tagInfo(event, props.characters[i].tag)}/>
                        <span className="character-tag" onClick={() => tagClick()}>{props.characters[i].tag.replaceAll("-", " ")}</span>
                        {characterSocials()}
                        <span className="tag-count">{props.characters[i].count}</span>
                    </span>
                </div> </>
                )
        }
        return jsx
    }

    const generateSeriesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < props.series.length; i++) {
            if (!props.series[i]) break
            const link = functions.getTagLink("series", props.series[i].image)
            const tagClick = () => {
                history.push(`/posts`)
                setSearch(props.series[i].tag)
                setSearchFlag(true)
            }
            const seriesSocials = () => {
                let jsx = [] as any 
                if (props.series[i].website) {
                    jsx.push(<img className="sidebar-social" src={website} onClick={() => window.open(props.series[i].website, "_blank")}/>)
                }
                if (props.series[i].twitter) {
                    jsx.push(<img className="sidebar-social" src={twitter} onClick={() => window.open(props.series[i].twitter, "_blank")}/>)
                }
                return jsx 
            }
            jsx.push(<>
                {link ?
                <div className="sidebar-row">
                    <img className="sidebar-img" src={link}/>
                </div> : null}
                <div className="sidebar-row">
                    <span className="tag-hover">
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, props.series[i].tag)} onAuxClick={(event) => tagInfo(event, props.series[i].tag)}/>
                        <span className="series-tag" onClick={() => tagClick()}>{props.series[i].tag.replaceAll("-", " ")}</span>
                        {seriesSocials()}
                        <span className="tag-count">{props.series[i].count}</span>
                    </span>
                </div> </>
                )
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
            const tagClass = () => {
                if (currentTags[i].type === "artist") return "artist-tag"
                if (currentTags[i].type === "character") return "character-tag"
                if (currentTags[i].type === "series") return "series-tag"
                if (currentTags[i].type === "meta") return "meta-tag"
                return "tag"
            }
            jsx.push(
                <div className="sidebar-row">
                    <span className="tag-hover">
                        <img className="tag-info" src={question} onClick={(event) => tagInfo(event, currentTags[i].tag)} onAuxClick={(event) => tagInfo(event, currentTags[i].tag)}/>
                        <span className={tagClass()} onClick={() => tagClick()}>{currentTags[i].tag.replaceAll("-", " ")}</span>
                        <span className="tag-count">{currentTags[i].count}</span>
                    </span>
                </div>
            )
        }
        return jsx
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
                <div className="sidebar-row">
                    <span className="tag">Mirrors:</span>
                    {jsx}
                </div>
            )
        }
        return null
    }

    const getDomain = () => {
        if (props.post.link) {
            try {
                const domain = new URL(props.post.link).hostname.replace("www.", "")
                .split(".")?.[0] || ""
                if (domain.toLowerCase() === "yande") return "Yandere"
                return functions.toProperCase(domain)
            } catch {
                return "Unknown"
            }
        }
        return "Unknown"
    }

    const triggerSearch = () => {
        history.push(`/posts`)
        setSearchFlag(true)
    }

    const randomSearch = async () => {
        if (history.location.pathname.includes("/post/")) {
            const posts = await axios.get("/api/search/random", {params: {type: "all", restrict: props.post.restrict === "explicit" ? "explicit" : "all", style: "all"}}).then((r) => r.data)
            history.push(`/post/${posts[0].postID}`)
        } else {
            history.push(`/posts`)
            setRandomFlag(true)
        }
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

    const postHistory = () => {
        window.scrollTo(0, 0)
        history.push(`/post/history/${props.post.postID}`)
    }
    
    const triggerQuickEdit = () => {
        if (props.unverified) {
            setQuickEditUnverified(true)
        } else {
            setQuickEditUnverified(false)
        }
        setQuickEditID(props.post.postID)
    }

    if (mobile) return (
        <>
        <SearchSuggestions active={suggestionsActive} sticky={true}/>
        <div className={`mobile-sidebar ${relative ? "mobile-sidebar-relative" : ""} ${mobileScrolling ? "hide-mobile-sidebar" : ""}`}>
            <div className="mobile-search-container">
                <input className="mobile-search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={(event) => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                <img style={{height: "40px"}} className="search-icon" src={getSearchIcon()} onClick={() => triggerSearch()}  onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                    <img style={{height: "40px"}} className="search-image-icon" src={getSearchImageIcon()} onMouseEnter={() => setSearchImageIconHover(true)} onMouseLeave={() => setSearchImageIconHover(false)}/>
                </label>
                <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                <img style={{height: "40px"}} className="random-mobile" src={getRandomMobileIcon()} onClick={randomSearch} onMouseEnter={() => setRandomMobileIconHover(true)} onMouseLeave={() => setRandomMobileIconHover(false)}/>
            </div>
        </div>
        </>
    )

    const generateUsernameJSX = (type?: string) => {
        let username = type === "uploader" ? props.post.uploader : props.post.updater 
        const role = type === "uploader" ? uploaderRole : updaterRole
        if (role === "admin") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                     <span className="tag-alt admin-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={adminCrown}/>
                </div>
            )
        } else if (role === "mod") {
            return (
                <div className="sidebar-username-container" onClick={() => username ? history.push(`/user/${username}`) : null}>
                    <span className="tag-alt mod-color">{functions.toProperCase(username) || "deleted"}</span>
                    <img className="sidebar-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="tag-alt-link" onClick={() => username ? history.push(`/user/${username}`) : null}>{functions.toProperCase(username) || "deleted"}</span>
    }

    const copyTagsJSX = () => {
        if (!session) return
        if (session.captchaAmount === undefined) session.captchaAmount = 501
        if (session.captchaAmount > 500) return null
        if (props.artists && props.characters && props.series && props.tags) {
            return (
                <div className="sidebar-subcontainer">
                    <div className="sidebar-row">
                        <span className="tag-hover" onClick={() => copyTags()} onAuxClick={() => copyTags(false, true)} onContextMenu={(event) => {event.preventDefault(); copyTags(true)}}>
                            <img className="sidebar-icon" src={getShowTags()}/>
                            <span className="tag-red">Copy Tags</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const tagCaptchaJSX = () => {
        if (!session) return
        if (session.captchaAmount === undefined) session.captchaAmount = 501
        if (session.captchaAmount > 500) {
            if (!history.location.pathname.includes("/post/") && !history.location.pathname.includes("/edit-post")) return
            const toggleCaptcha = () => {
                sessionStorage.setItem("ignoreCaptcha", "false")
                history.go(0)
            }
            return (
                <div className="sidebar-subcontainer">
                    <div className="sidebar-row">
                        <span className="tag-hover" onClick={toggleCaptcha}>
                            <img className="sidebar-icon" src={getShowTags()}/>
                            <span className="tag-red">Show Tags</span>
                        </span>
                    </div>
                </div>
            )
        }
    }

    const noTagsArtist = () => {
        if (!session) return
        if (session.captchaAmount === undefined) session.captchaAmount = 501
        if (session.captchaAmount > 500) {
            return (
                <div className="sidebar-row">
                    <span className="tag">Artist:</span>
                    <span className="tag-alt">{props.post.artist || "None"}</span>
                </div>
            )
        }
    }

    const copyTags = (replaceDash?: boolean, noCommas?: boolean) => {
        const artists = props.artists.map((a: any) => a.tag)
        const characters = props.characters.map((c: any) => c.tag)
        const series = props.series.map((s: any) => s.tag)
        const tags = props.tags.map((t: any) => t.tag)
        let combined = [...artists, ...characters, ...series, ...tags]
        if (replaceDash) combined = combined.map((c: string) => c.replaceAll("-", " "))
        navigator.clipboard.writeText(noCommas ? combined.join(" ") : combined.join(", "))
    }


    return (
        <>
        <SearchSuggestions active={suggestionsActive}/>
        <div className={`sidebar ${hideSidebar ? "hide-sidebar" : ""} ${hideTitlebar ? "sidebar-top" : ""}
        ${relative ? "sidebar-relative" : ""}`} onMouseEnter={() => {setEnableDrag(false); setSidebarHover(true)}} onMouseLeave={() => {setSidebarHover(false)}}>
            <div className="sidebar-container">
            <div className="sidebar-content">
                {sidebarText ?
                <div className="sidebar-text-container">
                    <span className="sidebar-text">{sidebarText}</span>
                </div> : null}
                <div className="search-container" onMouseEnter={() => setEnableDrag(false)}>
                    <input className="search" type="search" spellCheck="false" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? triggerSearch() : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    <img className="search-icon" src={getSearchIcon()} onClick={() => triggerSearch()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                    <label style={{display: "flex", width: "max-content", height: "max-content"}} htmlFor="image-search">
                        <img className="search-image-icon" src={getSearchImageIcon()} onMouseEnter={() => setSearchImageIconHover(true)} onMouseLeave={() => setSearchImageIconHover(false)}/>
                    </label>
                    <input id="image-search" type="file" onChange={(event) => imageSearch(event)}/>
                </div>
                <div className="random-container">
                    <img className="random" src={getRandomIcon()} onClick={randomSearch} onMouseEnter={() => setRandomIconHover(true)} onMouseLeave={() => setRandomIconHover(false)}/>
                    <img className="autosearch" src={getAutoSearch()} onClick={() => setAutoSearch((prev: boolean) => !prev)}/>
                </div>

                {copyTagsJSX()}
                {tagCaptchaJSX()}

                {props.artists ?
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.artists.length > 1 ? "Artists" : "Artist"}</span>
                        </div>
                        {generateArtistsJSX()}
                        {noTagsArtist()}
                        <div className="sidebar-row">
                            <span className="tag">Title:</span>
                            <span className="tag-alt">{props.post.title || "None"}</span>
                        </div>
                        {props.post.translatedTitle ? 
                        <div className="sidebar-row">
                            <span className="tag">Translated:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.translatedTitle)}</span>
                        </div>
                        : null}
                        <div className="sidebar-row">
                            <span className="tag">Drawn:</span>
                            <span className="tag-alt">{props.post.drawn ? functions.formatDate(new Date(props.post.drawn)) : "Unknown"}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Source:</span>
                            <span className="tag-alt-link" onClick={() => window.open(props.post.link, "_blank")}>{getDomain()}</span>
                        </div>
                        {generateMirrorsJSX()}
                    </div>
                : null}

                {props.characters ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">{props.characters.length > 1 ? "Characters" : "Character"}</span>
                        </div>
                        {generateCharactersJSX()}
                    </div>
                : null}

                {props.series ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Series</span>
                        </div>
                        {generateSeriesJSX()}
                    </div>
                : null}

                <div className="sidebar-subcontainer">
                    {props.tags ?
                        <div className="sidebar-row">
                            <span className="sidebar-title">Tags</span>
                        </div>
                    : null}
                    {generateTagJSX()}
                </div>

                {props.post ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="sidebar-title">Details</span>
                        </div>
                        <div className="sidebar-row">
                            <img className="sidebar-img" src={uploaderImage}/>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Uploader:</span>
                            {generateUsernameJSX("uploader")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Uploaded:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.uploadDate))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Updater:</span>
                            {generateUsernameJSX("updater")}
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Updated:</span>
                            <span className="tag-alt">{functions.formatDate(new Date(props.post.updatedDate))}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Type:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.type)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Restrict:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.restrict)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Style:</span>
                            <span className="tag-alt">{functions.toProperCase(props.post.style)}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Favorites:</span>
                            <span className="tag-alt">{props.post.favoriteCount || 0}</span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag">Cuteness:</span>
                            <span className="tag-alt">{props.post.cutenessAvg || 500}</span>
                        </div>
                    </div>
                : null}  

                {props.post && session.username && !props.noActions ? 
                    <div className="sidebar-subcontainer">
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerQuickEdit}>
                                <img className="sidebar-icon" src={getQuickEdit()}/>
                                <span className="tag">Quick Edit</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={triggerSetAvatar}>
                                <img className="sidebar-icon" src={getSetAvatar()}/>
                                <span className="tag">Set Avatar</span>
                            </span>
                        </div>
                        {/* 
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getAddTranslation()}/>
                                <span className="tag">Add Translation</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover">
                                <img className="sidebar-icon" src={getReport()}/>
                                <span className="tag">Report</span>
                            </span>
                        </div> */}
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={editPost}>
                                <img className="sidebar-icon" src={getEdit()}/>
                                <span className="tag-red">Edit</span>
                            </span>
                        </div>
                        {props.unverified ? <>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={approvePost}>
                                <img className="sidebar-icon" src={approveGreen}/>
                                <span className="tag-green">Approve</span>
                            </span>
                        </div>
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={rejectPost}>
                                <img className="sidebar-icon" src={rejectRed}/>
                                <span className="tag-red">Reject</span>
                            </span>
                        </div>
                        </> : null}
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={postHistory}>
                                <img className="sidebar-icon" src={getHistory()}/>
                                <span className="tag-red">History</span>
                            </span>
                        </div>
                        {!props.unverified ?
                        <div className="sidebar-row">
                            <span className="tag-hover" onClick={deletePost}>
                                <img className="sidebar-icon" src={getDeleteIcon()}/>
                                <span className="tag-red">Delete</span>
                            </span>
                        </div> : null}
                    </div>
                : null}
            </div>

            <div className="sidebar-footer">
                    <span className="sidebar-footer-text">©{new Date().getFullYear()} Moebooru</span>
                    <Link to="/terms">
                        <img className="sidebar-footer-icon" src={getTermsIcon()}/>
                    </Link>
                    <Link to="/contact">
                        <img className="sidebar-footer-icon" src={getContactIcon()}/>
                    </Link>
                    <img className="sidebar-footer-icon" src={getCodeIcon()} onClick={() => window.open(pack.repository.url, "_blank")}/>
                </div>
            </div>
        </div>
        </>
    )
}

export default SideBar