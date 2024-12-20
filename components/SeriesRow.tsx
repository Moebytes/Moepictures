import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useLayoutSelector, useSearchSelector, useCacheActions} from "../store"
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
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {ratingType} = useSearchSelector()
    const {setPosts} = useCacheActions()
    const [images, setImages] = useState([])
    const history = useHistory()

    const tagPage = (event: React.MouseEvent) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.series.tag}`, "_blank")
        } else {
            history.push(`/tag/${props.series.tag}`)
        }
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            let filtered = props.series.posts.filter((p: any) => p.rating === functions.r13())
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}/${post.slug}`, "_blank")
            } else {
                return history.push(`/post/${post.postID}/${post.slug}`)
            }
        }
        let filtered = props.series.posts.filter((p: any) => functions.isR18(ratingType) ? functions.isR18(p.rating) : !functions.isR18(p.rating))
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            history.push(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.series.posts)
    }

    const getImages = () => {
        let images = []
        if (!session.username) {
            let filtered = props.series.posts.filter((p: any) => p.rating === functions.r13())
            images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
        } else {
            let filtered = props.series.posts.filter((p: any) => functions.isR18(ratingType) ? functions.isR18(p.rating) : !functions.isR18(p.rating))
            images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
        }
        setImages(images)
    }

    useEffect(() => {
        getImages()
    }, [props.series])

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
                {props.series.image ? <img className="seriesrow-img" src={functions.getTagLink("series", props.series.image, props.series.imageHash)}/> : null}
                <span className="seriesrow-text-hover">
                    <span className="seriesrow-text" onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{functions.toProperCase(props.series.tag.replaceAll("-", " "))}</span>
                    {seriesSocialJSX()}
                    <span className="seriesrow-text-alt">{props.series.postCount}</span>
                </span>
            </div>
            <div className="seriesrow-row">
                <Carousel set={set} noKey={true} images={images} height={200}/>
            </div>
        </div>
    )
}

export default SeriesRow