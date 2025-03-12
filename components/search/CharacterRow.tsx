import React, {useContext, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useSessionSelector, useLayoutSelector, useSearchSelector, useCacheActions} from "../../store"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../../structures/Functions"
import Carousel from "../site/Carousel"
import fandom from "../../assets/icons/fandom.png"
import permissions from "../../structures/Permissions"
import "./styles/characterrow.less"
import {TagCategorySearch} from "../../types/Types"

interface Props {
    character: TagCategorySearch
}

const CharacterRow: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {ratingType} = useSearchSelector()
    const {setPosts} = useCacheActions()
    const [images, setImages] = useState([] as string[])
    const navigate = useNavigate()

    const tagPage = (event: React.MouseEvent) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.character.tag}`, "_blank")
        } else {
            navigate(`/tag/${props.character.tag}`)
        }
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            let filtered = props.character.posts.filter((p) => p.rating === functions.r13())
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}/${post.slug}`, "_blank")
            } else {
                return navigate(`/post/${post.postID}/${post.slug}`)
            }
        }
        let filtered = props.character.posts.filter((p) => functions.isR18(ratingType) ? functions.isR18(p.rating) : !functions.isR18(p.rating))
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.character.posts)
    }

    const getImages = () => {
        let images = [] as string[]
        if (!session.username) {
            let filtered = props.character.posts.filter((p) => p.rating === functions.r13())
            images = filtered.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        } else {
            let filtered = props.character.posts.filter((p) => functions.isR18(ratingType) ? functions.isR18(p.rating) : !functions.isR18(p.rating))
            images = filtered.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        }
        setImages(images)
    }

    useEffect(() => {
        getImages()
    }, [props.character])

    const characterSocialJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (props.character.fandom) {
            jsx.push(<img key="fandom" className="characterrow-social" src={fandom} onClick={() => window.open(props.character.fandom!, "_blank", "noreferrer")}/>)
        }
        return jsx
    }

    return (
        <div className="characterrow">
            <div className="characterrow-row">
                {props.character.image ? <img className="characterrow-img" src={functions.getTagLink("character", props.character.image, props.character.imageHash)}/> : null}
                <span className="characterrow-text-hover">
                    <span className="characterrow-text" onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{functions.toProperCase(props.character.tag.replaceAll("-", " "))}</span>
                    {characterSocialJSX()}
                    <span className="characterrow-text-alt">{props.character.postCount}</span>
                </span>
            </div>
            <div className="characterrow-row">
                <Carousel set={set} noKey={true} images={images} height={200}/>
            </div>
        </div>
    )
}

export default CharacterRow