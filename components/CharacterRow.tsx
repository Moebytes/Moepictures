import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import characterImg from "../assets/images/character.png"
import Carousel from "./Carousel"
import fandom from "../assets/purple/fandom.png"
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

    const searchTag = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            history.push("/posts")
        }
        setSearch(props.character.tag)
        setSearchFlag(true)
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            const filtered = props.character.posts.filter((p: any) => p.restrict === "safe")
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}`, "_blank")
            } else {
                return history.push(`/post/${post.postID}`)
            }
        }
        const filtered = props.character.posts.filter((p: any) => p.restrict !== "explicit")
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}`, "_blank")
        } else {
            history.push(`/post/${post.postID}`)
        }
    }

    const getImages = () => {
        if (!session.username) {
            const filtered = props.character.posts.filter((p: any) => p.restrict === "safe")
            return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        }
        const filtered = props.character.posts.filter((p: any) => p.restrict !== "explicit")
        return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
    }

    const characterSocialJSX = () => {
        let jsx = [] as any
        if (props.character.fandom) {
            jsx.push(<img className="characterrow-social" src={fandom} onClick={() => window.open(props.character.fandom, "_blank")}/>)
        }
        return jsx
    }

    return (
        <div className="characterrow">
            <div className="characterrow-row">
                {props.character.image ? <img className="characterrow-img" src={functions.getTagLink("character", props.character.image)}/> : null}
                <span className="characterrow-text-hover">
                    <span className="characterrow-text" onClick={searchTag} onAuxClick={searchTag}>{functions.toProperCase(props.character.tag.replaceAll("-", " "))}</span>
                    {characterSocialJSX()}
                    <span className="characterrow-text-alt">{props.character.postCount}</span>
                </span>
            </div>
            <div className="characterrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={200}/>
            </div>
        </div>
    )
}

export default CharacterRow