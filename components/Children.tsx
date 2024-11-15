import React from "react"
import {useHistory} from "react-router-dom"
import functions from "../structures/Functions"
import "./styles/children.less"
import Carousel from "./Carousel"

interface Props {
    posts: any
}

const Children: React.FunctionComponent<Props> = (props) => {
    const history = useHistory()
    const images = props.posts.map((t: any) => functions.getThumbnailLink(t.post.images[0].type, t.postID, t.post.images[0].order, t.post.images[0].filename, "small"))

    const click = (img: string, index: number) => {
        const post = props.posts[index]
        history.push(`/post/${post.postID}/${post.slug}`)
    }

    return (
        <div className="children">
            <div className="children-title">Child Posts</div>
            <div className="children-container">
                <Carousel images={images} set={click} noKey={true}/>
            </div>
        </div>
    )
}

export default Children