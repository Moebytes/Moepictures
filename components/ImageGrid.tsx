import React, {useContext} from "react"
import {ThemeContext, EnableDragContext} from "../App"
import img1 from "../assets/images/img1.png"
import img2 from "../assets/images/img2.png"
import img3 from "../assets/images/img3.png"
import img4 from "../assets/images/img4.png"
import img5 from "../assets/images/img5.png"
import img6 from "../assets/images/img6.png"
import img7 from "../assets/images/img7.png"
import img8 from "../assets/images/img8.png"
import "../styles/imagegrid.less"

const ImageGrid: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)

    return (
        <div className="imagegrid dragscroll" onMouseEnter={() => setEnableDrag(true)} onMouseLeave={() => setEnableDrag(false)}>
            <div className="image-container">
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
                <img className="image" src={img1}/>
                <img className="image" src={img2}/>
                <img className="image" src={img3}/>
                <img className="image" src={img4}/>
                <img className="image" src={img5}/>
                <img className="image" src={img6}/>
                <img className="image" src={img7}/>
                <img className="image" src={img8}/>
            </div>
        </div>
    )
}

export default ImageGrid