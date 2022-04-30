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
export const UploadDropFilesContext = React.createContext<any>(null)
export const SidebarHoverContext = React.createContext<any>(null)
export const ImageTypeContext = React.createContext<any>(null)
export const RestrictTypeContext = React.createContext<any>(null)
export const StyleTypeContext = React.createContext<any>(null)
export const SortTypeContext = React.createContext<any>(null)
export const SearchContext = React.createContext<any>(null)
export const SearchFlagContext = React.createContext<any>(null)
export const RandomFlagContext = React.createContext<any>(null)
export const ImageSearchFlagContext = React.createContext<any>(null)
export const TagsContext = React.createContext<any>(null)
export const SpeedContext = React.createContext<any>(null)
export const ReverseContext = React.createContext<any>(null)
export const HeaderTextContext = React.createContext<any>(null)
export const SidebarTextContext = React.createContext<any>(null)
export const SessionContext = React.createContext<any>(null)
export const SessionFlagContext = React.createContext<any>(null)
export const RedirectContext = React.createContext<any>(null)
export const UserImgContext = React.createContext<any>(null)
export const QuoteTextContext = React.createContext<any>(null)
export const MobileContext = React.createContext<any>(null)
export const HideMobileNavbarContext = React.createContext<any>(null)
export const ShowDeletePostDialogContext = React.createContext<any>(null)
export const DeleteCommentIDContext = React.createContext<any>(null)
export const DeleteCommentFlagContext = React.createContext<any>(null)
export const EditCommentIDContext = React.createContext<any>(null)
export const EditCommentFlagContext = React.createContext<any>(null)
export const EditCommentTextContext = React.createContext<any>(null)
export const DeleteTagIDContext = React.createContext<any>(null)
export const DeleteTagFlagContext = React.createContext<any>(null)
export const EditTagIDContext = React.createContext<any>(null)
export const EditTagFlagContext = React.createContext<any>(null)
export const EditTagKeyContext = React.createContext<any>(null)
export const EditTagImageContext = React.createContext<any>(null)
export const EditTagDescriptionContext = React.createContext<any>(null)
export const EditTagAliasesContext = React.createContext<any>(null)
export const AliasTagIDContext = React.createContext<any>(null)
export const AliasTagFlagContext = React.createContext<any>(null)
export const AliasTagNameContext = React.createContext<any>(null)
export const ShowDeleteAccountDialogContext = React.createContext<any>(null)
export const HeaderFlagContext = React.createContext<any>(null)
export const CommentSearchFlagContext = React.createContext<any>(null)
export const UnverifiedPostsContext = React.createContext<any>(null)
export const ModStateContext = React.createContext<any>(null)

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
    const [sidebarText, setSidebarText] = useState("")
    const [randomFlag, setRandomFlag] = useState(false)
    const [imageSearchFlag, setImageSearchFlag] = useState(null)
    const [redirect, setRedirect] = useState(null)
    const [quoteText, setQuoteText] = useState(null)
    const [hideMobileNavbar, setHideMobileNavbar] = useState(true)
    const [showDeletePostDialog, setShowDeletePostDialog] = useState(false)
    const [deleteCommentID, setDeleteCommentID] = useState(null)
    const [deleteCommentFlag, setDeleteCommentFlag] = useState(false)
    const [editCommentFlag, setEditCommentFlag] = useState(false)
    const [editCommentID, setEditCommentID] = useState(false)
    const [editCommentText, setEditCommentText] = useState(false)
    const [deleteTagID, setDeleteTagID] = useState(null)
    const [deleteTagFlag, setDeleteTagFlag] = useState(false)
    const [editTagFlag, setEditTagFlag] = useState(false)
    const [editTagID, setEditTagID] = useState(false)
    const [editTagKey, setEditTagKey] = useState(false)
    const [editTagImage, setEditTagImage] = useState(false)
    const [editTagDescription, setEditTagDescription] = useState(false)
    const [editTagAliases, setEditTagAliases] = useState(false)
    const [aliasTagID, setAliasTagID] = useState(null)
    const [aliasTagFlag, setAliasTagFlag] = useState(false)
    const [aliasTagName, setAliasTagName] = useState("")
    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
    const [headerFlag, setHeaderFlag] = useState(false)
    const [commentSearchFlag, setCommentSearchFlag] = useState(null)
    const [unverifiedPosts, setUnverifiedPosts] = useState([])
    const [modState, setModState] = useState("posts")
return (
    <>
        <ModStateContext.Provider value={{modState, setModState}}>
        <UnverifiedPostsContext.Provider value={{unverifiedPosts, setUnverifiedPosts}}>
        <CommentSearchFlagContext.Provider value={{commentSearchFlag, setCommentSearchFlag}}>
        <HeaderFlagContext.Provider value={{headerFlag, setHeaderFlag}}>
        <ShowDeleteAccountDialogContext.Provider value={{showDeleteAccountDialog, setShowDeleteAccountDialog}}>
        <AliasTagNameContext.Provider value={{aliasTagName, setAliasTagName}}>
        <AliasTagIDContext.Provider value={{aliasTagID, setAliasTagID}}>
        <AliasTagFlagContext.Provider value={{aliasTagFlag, setAliasTagFlag}}>
        <EditTagAliasesContext.Provider value={{editTagAliases, setEditTagAliases}}>
        <EditTagDescriptionContext.Provider value={{editTagDescription, setEditTagDescription}}>
        <EditTagImageContext.Provider value={{editTagImage, setEditTagImage}}>
        <EditTagKeyContext.Provider value={{editTagKey, setEditTagKey}}>
        <EditTagIDContext.Provider value={{editTagID, setEditTagID}}>
        <EditTagFlagContext.Provider value={{editTagFlag, setEditTagFlag}}>
        <DeleteTagFlagContext.Provider value={{deleteTagFlag, setDeleteTagFlag}}>
        <DeleteTagIDContext.Provider value={{deleteTagID, setDeleteTagID}}>
        <EditCommentTextContext.Provider value={{editCommentText, setEditCommentText}}>
        <EditCommentIDContext.Provider value={{editCommentID, setEditCommentID}}>
        <EditCommentFlagContext.Provider value={{editCommentFlag, setEditCommentFlag}}>
        <DeleteCommentFlagContext.Provider value={{deleteCommentFlag, setDeleteCommentFlag}}>
        <DeleteCommentIDContext.Provider value={{deleteCommentID, setDeleteCommentID}}>
        <ShowDeletePostDialogContext.Provider value={{showDeletePostDialog, setShowDeletePostDialog}}>
        <HideMobileNavbarContext.Provider value={{hideMobileNavbar, setHideMobileNavbar}}>
        <QuoteTextContext.Provider value={{quoteText, setQuoteText}}>
        <RedirectContext.Provider value={{redirect, setRedirect}}>
        <SidebarTextContext.Provider value={{sidebarText, setSidebarText}}>
        <ImageSearchFlagContext.Provider value={{imageSearchFlag, setImageSearchFlag}}>
        <RandomFlagContext.Provider value={{randomFlag, setRandomFlag}}>
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
        </RandomFlagContext.Provider>
        </ImageSearchFlagContext.Provider>
        </SidebarTextContext.Provider>
        </RedirectContext.Provider>
        </QuoteTextContext.Provider>
        </HideMobileNavbarContext.Provider>
        </ShowDeletePostDialogContext.Provider>
        </DeleteCommentIDContext.Provider>
        </DeleteCommentFlagContext.Provider>
        </EditCommentFlagContext.Provider>
        </EditCommentIDContext.Provider>
        </EditCommentTextContext.Provider>
        </DeleteTagIDContext.Provider>
        </DeleteTagFlagContext.Provider>
        </EditTagFlagContext.Provider>
        </EditTagIDContext.Provider>
        </EditTagKeyContext.Provider>
        </EditTagImageContext.Provider>
        </EditTagDescriptionContext.Provider>
        </EditTagAliasesContext.Provider>
        </AliasTagFlagContext.Provider>
        </AliasTagIDContext.Provider>
        </AliasTagNameContext.Provider>
        </ShowDeleteAccountDialogContext.Provider>
        </HeaderFlagContext.Provider>
        </CommentSearchFlagContext.Provider>
        </UnverifiedPostsContext.Provider>
        </ModStateContext.Provider>
    </>
    )
}

export default Context