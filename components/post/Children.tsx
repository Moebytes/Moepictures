/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import {useNavigate} from "react-router-dom"
import functions from "../../functions/Functions"
import {useLayoutSelector, useSessionSelector, useThemeSelector, useFlagActions} from "../../store"
import Carousel from "../site/Carousel"
import {ChildPost} from "../../types/Types"
import "./styles/children.less"

interface Props {
    posts: ChildPost[]
}

const Children: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {setPostFlag} = useFlagActions()
    const navigate = useNavigate()
    const images = props.posts.map((child) => functions.link.getThumbnailLink(child.post.images[0], "tiny", session, mobile))

    const click = (img: string, index: number) => {
        const post = props.posts[index].post
        navigate(`/post/${post.postID}/${post.slug}`, {replace: true})
        setPostFlag(post.postID)
    }

    return (
        <div className="children">
            <div className="children-title">{i18n.post.childPosts}</div>
            <div className="children-container">
                <Carousel images={images} set={click} noKey={true} unlimited={true}/>
            </div>
        </div>
    )
}

export default Children