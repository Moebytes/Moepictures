import React, {useState} from "react"

export const ThemeContext = React.createContext<any>(null)
export const HideSortbarContext = React.createContext<any>(null)
export const HideSidebarContext = React.createContext<any>(null)
export const HideNavbarContext = React.createContext<any>(null)
export const HideTitlebarContext = React.createContext<any>(null)
export const EnableDragContext = React.createContext<any>(null)
export const ActiveDropdownContext = React.createContext<any>(null)
export const SizeTypeContext = React.createContext<any>(null)
export const FilterDropActiveContext = React.createContext<any>(null)
export const SquareContext = React.createContext<any>(null)
export const BrightnessContext = React.createContext<any>(null)
export const ContrastContext = React.createContext<any>(null)
export const HueContext = React.createContext<any>(null)
export const SaturationContext = React.createContext<any>(null)
export const LightnessContext = React.createContext<any>(null)
export const BlurContext = React.createContext<any>(null)
export const SharpenContext = React.createContext<any>(null)
export const PixelateContext = React.createContext<any>(null)
export const PostAmountContext = React.createContext<any>(null)
export const PostsContext = React.createContext<any>(null)
export const DownloadURLsContext = React.createContext<any>(null)
export const DownloadFlagContext = React.createContext<any>(null)
export const RelativeContext = React.createContext<any>(null)
export const ShowDownloadDialogContext = React.createContext<any>(null)
export const DisableZoomContext = React.createContext<any>(null)
export const SearchDropFilesContext = React.createContext<any>(null)
export const UploadDropFilesContext = React.createContext<any>(null)
export const SidebarHoverContext = React.createContext<any>(null)
export const ImageTypeContext = React.createContext<any>(null)
export const RestrictTypeContext = React.createContext<any>(null)
export const StyleTypeContext = React.createContext<any>(null)
export const SortTypeContext = React.createContext<any>(null)
export const SearchContext = React.createContext<any>(null)
export const SearchFlagContext = React.createContext<any>(null)
export const TagsContext = React.createContext<any>(null)
export const SpeedContext = React.createContext<any>(null)
export const ReverseContext = React.createContext<any>(null)
export const HeaderTextContext = React.createContext<any>(null)

const Context: React.FunctionComponent = (props) => {
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [hue, setHue] = useState(180)
    const [saturation, setSaturation] = useState(100)
    const [lightness, setLightness] = useState(100)
    const [blur, setBlur] = useState(0)
    const [sharpen, setSharpen] = useState(0)
    const [pixelate, setPixelate] = useState(1)
    const [square, setSquare] = useState(false)
    const [showDownloadDialog, setShowDownloadDialog] = useState(false)
    const [postAmount, setPostAmount] = useState(0)
    const [downloadURLs, setDownloadURLs] = useState([])
    const [downloadFlag, setDownloadFlag] = useState(false)
    const [relative, setRelative] = useState(false)
    const [posts, setPosts] = useState([]) as any
    const [disableZoom, setDisableZoom] = useState(true)
    const [searchDropFiles, setSearchDropFiles] = useState([])
    const [uploadDropFiles, setUploadDropFiles] = useState([])
    const [imageType, setImageType] = useState("all")
    const [restrictType, setRestrictType] = useState("all")
    const [styleType, setStyleType] = useState("all")
    const [sizeType, setSizeType] = useState("medium")
    const [sortType, setSortType] = useState("date")
    const [search, setSearch] = useState("")
    const [searchFlag, setSearchFlag] = useState(false)
    const [speed, setSpeed] = useState(1)
    const [reverse, setReverse] = useState(false)
    const [tags, setTags] = useState([])
    const [headerText, setHeaderText] = useState("")

return (
    <>
        <HeaderTextContext.Provider value={{headerText, setHeaderText}}>
        <TagsContext.Provider value={{tags, setTags}}>
        <ReverseContext.Provider value={{reverse, setReverse}}>
        <SpeedContext.Provider value={{speed, setSpeed}}>
        <SearchFlagContext.Provider value={{searchFlag, setSearchFlag}}>
        <SearchContext.Provider value={{search, setSearch}}>
        <SortTypeContext.Provider value={{sortType, setSortType}}>
        <StyleTypeContext.Provider value={{styleType, setStyleType}}>
        <RestrictTypeContext.Provider value={{restrictType, setRestrictType}}>
        <ImageTypeContext.Provider value={{imageType, setImageType}}>
        <SearchDropFilesContext.Provider value={{searchDropFiles, setSearchDropFiles}}>
        <UploadDropFilesContext.Provider value={{uploadDropFiles, setUploadDropFiles}}>
        <DisableZoomContext.Provider value={{disableZoom, setDisableZoom}}>
        <RelativeContext.Provider value={{relative, setRelative}}>
        <DownloadURLsContext.Provider value={{downloadURLs, setDownloadURLs}}>
        <DownloadFlagContext.Provider value={{downloadFlag, setDownloadFlag}}>
        <PostsContext.Provider value={{posts, setPosts}}>
        <PostAmountContext.Provider value={{postAmount, setPostAmount}}>
        <ShowDownloadDialogContext.Provider value={{showDownloadDialog, setShowDownloadDialog}}>
        <PixelateContext.Provider value={{pixelate, setPixelate}}>
        <SquareContext.Provider value={{square, setSquare}}>
        <BrightnessContext.Provider value={{brightness, setBrightness}}>
        <ContrastContext.Provider value={{contrast, setContrast}}>
        <HueContext.Provider value={{hue, setHue}}>
        <SaturationContext.Provider value={{saturation, setSaturation}}>
        <LightnessContext.Provider value={{lightness, setLightness}}>
        <BlurContext.Provider value={{blur, setBlur}}>
        <SharpenContext.Provider value={{sharpen, setSharpen}}>
        <SizeTypeContext.Provider value={{sizeType, setSizeType}}>
            {props.children}
        </SizeTypeContext.Provider>
        </SharpenContext.Provider>
        </BlurContext.Provider>
        </LightnessContext.Provider>
        </SaturationContext.Provider>
        </HueContext.Provider>
        </ContrastContext.Provider>
        </BrightnessContext.Provider>
        </SquareContext.Provider>
        </PixelateContext.Provider>
        </ShowDownloadDialogContext.Provider>
        </PostAmountContext.Provider>
        </PostsContext.Provider>
        </DownloadFlagContext.Provider>
        </DownloadURLsContext.Provider>
        </RelativeContext.Provider>
        </DisableZoomContext.Provider>
        </UploadDropFilesContext.Provider>
        </SearchDropFilesContext.Provider>
        </ImageTypeContext.Provider>
        </RestrictTypeContext.Provider>
        </StyleTypeContext.Provider>
        </SortTypeContext.Provider>
        </SearchContext.Provider>
        </SearchFlagContext.Provider>
        </SpeedContext.Provider>
        </ReverseContext.Provider>
        </TagsContext.Provider>
        </HeaderTextContext.Provider>
    </>
    )
}

export default Context