import React, { useEffect } from "react"
import {useThemeSelector, useLayoutSelector, useSearchActions, useThemeActions} from "../../store"
import backToTop from "../../assets/icons/backtotop.png"
import enIcon from "../../assets/icons/translation-en.png"
import jaIcon from "../../assets/icons/translation-ja.png"
import "./styles/footer.less"

interface Props {
    noPadding?: boolean
}

const Footer: React.FunctionComponent<Props> = (props) => {
    const {language, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setLanguage} = useThemeActions()
    const {mobile} = useLayoutSelector()
    const {setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSortType} = useSearchActions()

    useEffect(() => {
        const savedLanguage = localStorage.getItem("language")
        const browserLang = window.navigator.language.split("-")[0]
        const langPref = savedLanguage || browserLang
        if (langPref === "ja") {
            setLanguage("ja")
        } else {
            setLanguage("en")
        }
    }, [])

    useEffect(() => {
        localStorage.setItem("language", language)
    }, [language])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const goToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"})
    }

    const logoClick = () => {
        setSearch("")
        setImageType("all")
        setRatingType("all")
        setStyleType("all")
        setSortType("date")
        setSearchFlag(true)
        window.scrollTo(0, 0)
    }

    const changeLanguage = () => {
        if (language === "ja") {
            setLanguage("en")
        } else {
            setLanguage("ja")
        }
    }

    const getLanguageIcon = () => {
        if (language === "ja") return jaIcon
        return enIcon
    }

    const getLanguageText = () => {
        if (language === "ja") return "Japanese"
        return "English"
    }

    return (
        <>
        {!props.noPadding ? <div style={{height: "100%", pointerEvents: "none"}}></div> : null}
        <div className="footer">
            <div className="footer-title-container" onClick={logoClick}>
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
                <span className="footer-text">- {i18n.footer.bottom} -</span>
            </div> : null}
            <div className="footer-container">
                <div className="footer-click-container" onClick={() => changeLanguage()}>
                    <img className="footer-img" src={getLanguageIcon()} style={{height: "20px", marginRight: "5px", filter: getFilter()}}/>
                    <span className="footer-text">{getLanguageText()}</span>
                </div>
                <div className="footer-click-container" onClick={() => goToTop()}>
                    <img className="footer-img" src={backToTop} style={{filter: getFilter()}}/>
                    <span className="footer-text">{i18n.footer.top}</span>
                </div>
            </div>
        </div>
        </>
    )
}

export default Footer