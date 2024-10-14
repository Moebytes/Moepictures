import React, {useContext, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext, MobileContext, RestrictTypeContext, PostsContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Carousel from "./Carousel"
import website from "../assets/icons/support.png"
import twitter from "../assets/icons/twitter.png"
import permissions from "../structures/Permissions"
import "./styles/seriesrow.less"

interface Props {
    series: any
}

const SeriesRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {posts, setPosts} = useContext(PostsContext)
    const history = useHistory()

    const searchTag = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            //window.open("/posts", "_blank")
            window.open(`/tag/${props.series.tag}`, "_blank")
        } else {
            //history.push("/posts")
            history.push(`/tag/${props.series.tag}`)
        }
        //setSearch(props.artist.tag)
        //setSearchFlag(true)
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            let filtered = props.series.posts.filter((p: any) => p.restrict === "safe")
            if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}`, "_blank")
            } else {
                return history.push(`/post/${post.postID}`)
            }
        }
        let filtered = props.series.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}`, "_blank")
        } else {
            history.push(`/post/${post.postID}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.series.posts)
    }

    const getImages = () => {
        if (!session.username) {
            let filtered = props.series.posts.filter((p: any) => p.restrict === "safe")
            if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
            return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
        }
        let filtered = props.series.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        if (!permissions.isMod(session)) filtered = filtered.filter((p: any) => !p.hidden)
        return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
    }

    const seriesSocialJSX = () => {
        let jsx = [] as any
        if (props.series.website) {
            jsx.push(<img className="artistrow-social" src={website} onClick={() => window.open(props.series.website, "_blank", "noreferrer")}/>)
        }
        if (props.series.twitter) {
            jsx.push(<img className="artistrow-social" src={twitter} onClick={() => window.open(props.series.twitter, "_blank", "noreferrer")}/>)
        }
        return jsx
    }

    return (
        <div className="seriesrow">
            <div className="seriesrow-row">
                {props.series.image ? <img className="seriesrow-img" src={functions.getTagLink("series", props.series.image)}/> : null}
                <span className="seriesrow-text-hover">
                    <span className="seriesrow-text" onClick={searchTag} onAuxClick={searchTag}>{functions.toProperCase(props.series.tag.replaceAll("-", " "))}</span>
                    {seriesSocialJSX()}
                    <span className="seriesrow-text-alt">{props.series.postCount}</span>
                </span>
            </div>
            <div className="seriesrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={200}/>
            </div>
        </div>
    )
}

export default SeriesRow