import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useCacheActions, useLayoutSelector} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import GridImage from "./GridImage"
import Carousel from "./Carousel"
import "./styles/related.less"

interface Props {
    related: any
}

const Related: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {setPosts} = useCacheActions()
    const [related, setRelated] = useState([]) as any
    const history = useHistory()

    const updateRelated = () => {
        setRelated(functions.shuffleArray(props.related).slice(0, 30))
    }

    useEffect(() => {
        updateRelated()
    }, [props.related])


    const getImages = () => {
        return related.map((post: any) => functions.getThumbnailLink(post.images[0].type, post.postID, post.images[0].order, post.images[0].filename, "medium"))
    }

    const click = (img: string, index: number) => {
        const post = related[index]
        history.push(`/post/${post.postID}/${post.slug}`)
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.related)
    }

    let marginLeft = mobile ? 20 : 200

    if (!related.length) return null

    return (
        <div className="related" style={{paddingLeft: `${marginLeft}px`, marginBottom: "10px"}}>
            <div className="related-title" style={{marginBottom: "0px"}}>Related</div>
            <div className="related-container">
                <Carousel images={getImages()} set={click} noKey={true} marginLeft={marginLeft} height={200}/>
            </div>
        </div>
    )
}

export default Related