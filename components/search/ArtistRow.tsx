import React, { useEffect, useState } from "react"
import {useNavigate} from "react-router-dom"
import {useSessionSelector, useLayoutSelector, useSearchSelector, useCacheActions} from "../../store"
import functions from "../../functions/Functions"
import Carousel from "../site/Carousel"
import website from "../../assets/icons/website.png"
import pixiv from "../../assets/icons/pixiv.png"
import soundcloud from "../../assets/icons/soundcloud.png"
import sketchfab from "../../assets/icons/sketchfab.png"
import twitter from "../../assets/icons/twitter.png"
import permissions from "../../structures/Permissions"
import "./styles/artistrow.less"
import {TagCategorySearch} from "../../types/Types"

interface Props {
    artist: TagCategorySearch
}

const ArtistRow: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {ratingType} = useSearchSelector()
    const {setPosts} = useCacheActions()
    const [images, setImages] = useState([] as string[])
    const navigate = useNavigate()

    const tagPage = (event: React.MouseEvent) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.artist.tag}`, "_blank")
        } else {
            navigate(`/tag/${props.artist.tag}`)
        }
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            const filtered = props.artist.posts.filter((p) => p.rating === functions.r13())
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}/${post.slug}`, "_blank")
            } else {
                return navigate(`/post/${post.postID}/${post.slug}`)
            }
        }
        let filtered = props.artist.posts.filter((p) => functions.post.isR18(ratingType) ? functions.post.isR18(p.rating) : !functions.post.isR18(p.rating))
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.dom.navbarHeight() + functions.dom.titlebarHeight())
        setPosts(props.artist.posts)
    }

    const getImages = () => {
        let images = [] as string[]
        if (!session.username) {
            let filtered = props.artist.posts.filter((p) => p.rating === functions.r13())
            images = filtered.map((p) => functions.link.getThumbnailLink(p.images[0], "tiny", session, mobile))
        } else {
            let filtered = props.artist.posts.filter((p) => functions.post.isR18(ratingType) ? functions.post.isR18(p.rating) : !functions.post.isR18(p.rating))
            images = filtered.map((p) => functions.link.getThumbnailLink(p.images[0], "tiny", session, mobile))
        }
        setImages(images)
    }

    useEffect(() => {
        getImages()
    }, [props.artist])

    const artistSocialJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (props.artist.website) {
            jsx.push(<img key="website" className="artistrow-social" src={website} onClick={() => window.open(props.artist.website!, "_blank", "noreferrer")}/>)
        }
        if (props.artist.social?.includes("pixiv.net")) {
            jsx.push(<img key="social" className="artistrow-social" src={pixiv} onClick={() => window.open(props.artist.social!, "_blank", "noreferrer")}/>)
        } else if (props.artist.social?.includes("soundcloud.com")) {
            jsx.push(<img key="social" className="artistrow-social" src={soundcloud} onClick={() => window.open(props.artist.social!, "_blank", "noreferrer")}/>)
        } else if (props.artist.social?.includes("sketchfab.com")) {
            jsx.push(<img key="social" className="artistrow-social" src={sketchfab} onClick={() => window.open(props.artist.social!, "_blank", "noreferrer")}/>)
        }
        if (props.artist.twitter) {
            jsx.push(<img key="twitter" className="artistrow-social" src={twitter} onClick={() => window.open(props.artist.twitter!, "_blank", "noreferrer")}/>)
        }
        return jsx
    }

    return (
        <div className="artistrow">
            <div className="artistrow-row">
                {props.artist.image ? <img className="artistrow-img" src={functions.link.getTagLink("artist", props.artist.image, props.artist.imageHash)}/> : null}
                <span className="artistrow-text-hover">
                    <span className="artistrow-text" onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{functions.util.toProperCase(props.artist.tag.replaceAll("-", " "))}</span>
                    {artistSocialJSX()}
                    <span className="artistrow-text-alt">{props.artist.postCount}</span>
                </span>
            </div>
            <div className="artistrow-row">
                <Carousel set={set} noKey={true} images={images} height={200}/>
            </div>
        </div>
    )
}

export default ArtistRow