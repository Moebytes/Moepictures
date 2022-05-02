import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import artistImg from "../assets/images/artist.png"
import Carousel from "./Carousel"
import "./styles/artistrow.less"

interface Props {
    artist: any
}

const ArtistRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()

    const searchTag = () => {
        history.push("/posts")
        setSearch(props.artist.tag)
        setSearchFlag(true)
    }

    const set = (image: string, index: number) => {
        if (!session.username) {
            const filtered = props.artist.posts.filter((p: any) => p.restrict === "safe")
            const post = filtered[index] 
            return history.push(`/post/${post.postID}`)
        }
        const post = props.artist.posts[index] 
        history.push(`/post/${post.postID}`)
    }

    const getImages = () => {
        if (!session.username) {
            const filtered = props.artist.posts.filter((p: any) => p.restrict === "safe")
            return filtered.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))
        }
        return props.artist.posts.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))
    }

    return (
        <div className="artistrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="artistrow-row">
                {props.artist.image ? <img className="artistrow-img" src={functions.getTagLink("artist", props.artist.image)}/> : null}
                <span className="artistrow-text-hover" onClick={searchTag}>
                    <span className="artistrow-text">{functions.toProperCase(props.artist.tag.replaceAll("-", " "))}</span>
                    <span className="artistrow-text-alt">{props.artist.postCount}</span>
                </span>
            </div>
            <div className="artistrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={130}/>
            </div>
        </div>
    )
}

export default ArtistRow