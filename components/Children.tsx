import React from "react"
import {useHistory} from "react-router-dom"
import functions from "../structures/Functions"
import {useThemeSelector} from "../store"
import "./styles/children.less"
import Carousel from "./Carousel"
import {ChildPost} from "../types/Types"

interface Props {
    posts: ChildPost[]
}

const Children: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const history = useHistory()
    const images = props.posts.map((child) => functions.getThumbnailLink(child.post.images[0].type, child.postID, 
    child.post.images[0].order, child.post.images[0].filename, "small"))

    const click = (img: string, index: number) => {
        const post = props.posts[index].post
        history.push(`/post/${post.postID}/${post.slug}`)
    }

    return (
        <div className="children">
            <div className="children-title">{i18n.post.childPosts}</div>
            <div className="children-container">
                <Carousel images={images} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Children