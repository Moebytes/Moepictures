import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext} from "../Context"
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
    const history = useHistory()

    const searchTag = () => {
        setSearch(props.artist.tag)
        setSearchFlag(true)
        history.push("/posts")
    }

    const set = (image: string, index: number) => {
        const post = props.artist.posts[index] 
        history.push(`/post/${post.postID}`)
    }

    return (
        <div className="artistrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="artistrow-row">
                {props.artist.image ? <img className="artistrow-img" src={functions.getTagLink("artist", props.artist.image)}/> : null}
                <span className="artistrow-text-hover" onClick={searchTag}>
                    <span className="artistrow-text">{props.artist.tag.replaceAll("-", " ")}</span>
                    <span className="artistrow-text-alt">{props.artist.postCount}</span>
                </span>
            </div>
            <div className="artistrow-row">
                <Carousel set={set} noKey={true} images={props.artist.posts.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))} height={130}/>
            </div>
        </div>
    )
}

export default ArtistRow