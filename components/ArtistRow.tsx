import React, {useContext, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, RestrictTypeContext, MobileContext, PostsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Carousel from "./Carousel"
import website from "../assets/icons/support.png"
import pixiv from "../assets/icons/pixiv.png"
import soundcloud from "../assets/icons/soundcloud.png"
import sketchfab from "../assets/icons/sketchfab.png"
import twitter from "../assets/icons/twitter.png"
import permissions from "../structures/Permissions"
import "./styles/artistrow.less"

interface Props {
    artist: any
}

const ArtistRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const history = useHistory()

    const tagPage = (event: React.MouseEvent) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.artist.tag}`, "_blank")
        } else {
            history.push(`/tag/${props.artist.tag}`)
        }
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            const filtered = props.artist.posts.filter((p: any) => p.restrict === "safe")
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}`, "_blank")
            } else {
                return history.push(`/post/${post.postID}`)
            }
        }
        let filtered = props.artist.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}`, "_blank")
        } else {
            history.push(`/post/${post.postID}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.artist.posts)
    }

    const getImages = () => {
        if (!session.username) {
            let filtered = props.artist.posts.filter((p: any) => p.restrict === "safe")
            if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
            return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
        }
        let filtered = props.artist.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
        return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
    }

    const artistSocialJSX = () => {
        let jsx = [] as any
        if (props.artist.website) {
            jsx.push(<img className="artistrow-social" src={website} onClick={() => window.open(props.artist.website, "_blank", "noreferrer")}/>)
        }
        if (props.artist.social?.includes("pixiv.net")) {
            jsx.push(<img className="artistrow-social" src={pixiv} onClick={() => window.open(props.artist.social, "_blank", "noreferrer")}/>)
        } else if (props.artist.social?.includes("soundcloud.com")) {
            jsx.push(<img className="artistrow-social" src={soundcloud} onClick={() => window.open(props.artist.social, "_blank", "noreferrer")}/>)
        } else if (props.artist.social?.includes("sketchfab.com")) {
            jsx.push(<img className="artistrow-social" src={sketchfab} onClick={() => window.open(props.artist.social, "_blank", "noreferrer")}/>)
        }
        if (props.artist.twitter) {
            jsx.push(<img className="artistrow-social" src={twitter} onClick={() => window.open(props.artist.twitter, "_blank", "noreferrer")}/>)
        }
        return jsx
    }

    return (
        <div className="artistrow">
            <div className="artistrow-row">
                {props.artist.image ? <img className="artistrow-img" src={functions.getTagLink("artist", props.artist.image)}/> : null}
                <span className="artistrow-text-hover">
                    <span className="artistrow-text" onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{functions.toProperCase(props.artist.tag.replaceAll("-", " "))}</span>
                    {artistSocialJSX()}
                    <span className="artistrow-text-alt">{props.artist.postCount}</span>
                </span>
            </div>
            <div className="artistrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={200}/>
            </div>
        </div>
    )
}

export default ArtistRow