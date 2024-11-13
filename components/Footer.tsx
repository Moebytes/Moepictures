import React from "react"
import {useThemeSelector, useLayoutSelector, useSearchActions} from "../store"
import backToTop from "../assets/icons/backtotop.png"
import "./styles/footer.less"

interface Props {
    noPadding?: boolean
}

const Footer: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {setSearch, setSearchFlag, setImageType, setRestrictType, setStyleType, setSortType} = useSearchActions()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const goToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"})
    }

    const footerClick = () => {
        setSearch("")
        setImageType("all")
        setRestrictType("all")
        setStyleType("all")
        setSortType("date")
        setSearchFlag(true)
        window.scrollTo(0, 0)
    }

    return (
        <>
        {!props.noPadding ? <div style={{height: "100%", pointerEvents: "none"}}></div> : null}
        <div className="footer">
            <div className="footer-title-container" onClick={footerClick}>
                    <span className="footer-title-a">M</span>
                    <span className="footer-title-b">o</span>
                    <span className="footer-title-a">e</span>
                    <span className="footer-title-b">p</span>
                    <span className="footer-title-a">i</span>
                    <span className="footer-title-b">c</span>
                    <span className="footer-title-a">t</span>
                    <span className="footer-title-b">u</span>
                    <span className="footer-title-a">r</span>
                    <span className="footer-title-b">e</span>
                    <span className="footer-title-a">s</span>
            </div>
            {!mobile ? <div className="footer-text-container">
                <span className="footer-text">- This is the bottom of the page -</span>
            </div> : null}
            <div className="footer-back-to-top" onClick={() => goToTop()}>
                <img className="footer-img" src={backToTop} style={{filter: getFilter()}}/>
                <span className="footer-text">Back to top</span>
            </div>
        </div>
        </>
    )
}

export default Footer