import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import characterImg from "../assets/images/character.png"
import Carousel from "./Carousel"
import "./styles/characterrow.less"

interface Props {
    character: any
}

const CharacterRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()

    const searchTag = () => {
        setSearch(props.character.tag)
        setSearchFlag(true)
        history.push("/posts")
    }

    const set = (image: string, index: number) => {
        const post = props.character.posts[index] 
        history.push(`/post/${post.postID}`)
    }

    const getImages = () => {
        if (!session.username) {
            const filtered = props.character.posts.filter((p: any) => p.restrict === "safe")
            return filtered.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))
        }
        return props.character.posts.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))
    }

    return (
        <div className="characterrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="characterrow-row">
                {props.character.image ? <img className="characterrow-img" src={functions.getTagLink("character", props.character.image)}/> : null}
                <span className="characterrow-text-hover" onClick={searchTag}>
                    <span className="characterrow-text">{props.character.tag.replaceAll("-", " ")}</span>
                    <span className="characterrow-text-alt">{props.character.postCount}</span>
                </span>
            </div>
            <div className="characterrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={130}/>
            </div>
        </div>
    )
}

export default CharacterRow