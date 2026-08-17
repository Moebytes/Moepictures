/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import {useNavigate} from "react-router-dom"
import {useLayoutSelector, useCacheActions, useThemeSelector, useSessionSelector, 
useFlagActions, useSearchActions} from "../../store"
import functions from "../../functions/Functions"
import Carousel from "../site/Carousel"
import {PostFull} from "../../types/Types"
import "./styles/related.less"

interface Props {
    tag: string
    posts: PostFull[]
}

const ArtistWorks: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {setNavigationPosts} = useCacheActions()
    const {setPostFlag} = useFlagActions()
    const navigate = useNavigate()

    const getImages = () => {
        return props.posts.map((post) => functions.link.getThumbnailLink(post.images[0], "tiny", session, mobile))
    }

    const click = (img: string, index: number) => {
        const post = props.posts[index]
        navigate(`/post/${post.postID}/${post.slug}`, {replace: true})
        setPostFlag(post.postID)
        setTimeout(() => {
            setNavigationPosts(props.posts)
        }, 500)
    }

    const searchTag = (event: React.MouseEvent) => {
        if (!props.tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${props.tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(props.tag)
            setSearchFlag(true)
        }
    }

    let marginLeft = mobile ? 20 : 200

    if (!props.posts.length) return null

    return (
        <div className="related">
            <div className="related-title" onClick={searchTag} onAuxClick={searchTag}>{i18n.post.artistWorks}</div>
            <div className="related-container">
                <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200} unlimited={true}/>
            </div>
        </div>
    )
}

export default ArtistWorks