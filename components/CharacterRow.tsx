import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import characterImg from "../assets/images/character.png"
import Carousel from "./Carousel"
import page1 from "../assets/images/KarenComplex/001.jpg"
import page2 from "../assets/images/KarenComplex/002.jpg"
import page3 from "../assets/images/KarenComplex/003.jpg"
import page4 from "../assets/images/KarenComplex/004.jpg"
import page5 from "../assets/images/KarenComplex/005.jpg"
import page6 from "../assets/images/KarenComplex/006.jpg"
import page7 from "../assets/images/KarenComplex/007.jpg"
import page8 from "../assets/images/KarenComplex/008.jpg"
import page9 from "../assets/images/KarenComplex/009.jpg"
import page10 from "../assets/images/KarenComplex/010.jpg"
import page11 from "../assets/images/KarenComplex/011.jpg"
import page12 from "../assets/images/KarenComplex/012.jpg"
import page13 from "../assets/images/KarenComplex/013.jpg"
import page14 from "../assets/images/KarenComplex/014.jpg"
import page15 from "../assets/images/KarenComplex/015.jpg"
import page16 from "../assets/images/KarenComplex/016.jpg"
import page17 from "../assets/images/KarenComplex/017.jpg"
import page18 from "../assets/images/KarenComplex/018.jpg"
import page19 from "../assets/images/KarenComplex/019.jpg"
import page20 from "../assets/images/KarenComplex/020.jpg"
import page21 from "../assets/images/KarenComplex/021.jpg"
import page22 from "../assets/images/KarenComplex/022.jpg"
import page23 from "../assets/images/KarenComplex/023.jpg"
import page24 from "../assets/images/KarenComplex/024.jpg"
import page25 from "../assets/images/KarenComplex/025.jpg"
import page26 from "../assets/images/KarenComplex/026.jpg"
import page27 from "../assets/images/KarenComplex/027.jpg"
import page28 from "../assets/images/KarenComplex/028.jpg"
import page29 from "../assets/images/KarenComplex/029.jpg"
import page30 from "../assets/images/KarenComplex/030.jpg"
import "./styles/characterrow.less"

const pages = [page1, page2, page3, page4, page5,
    page6, page7, page8, page9, page10,
    page11, page12, page13, page14, page15,
    page16, page17, page18, page19, page20,
    page21, page22, page23, page24, page25,
    page26, page27, page28, page29, page30]

const CharacterRow: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)

    return (
        <div className="characterrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="characterrow-row">
                <img className="characterrow-img" src={characterImg}/>
                <span className="characterrow-text-hover">
                    <span className="characterrow-text">Klee</span>
                    <span className="characterrow-text-alt">4542</span>
                </span>
            </div>
            <div className="characterrow-row">
                <Carousel images={pages} height={130}/>
            </div>
        </div>
    )
}

export default CharacterRow