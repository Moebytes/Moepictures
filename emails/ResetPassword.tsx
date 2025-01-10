import {Html, Head, Body, Preview, Container, Text, Img, Link, Button} from "@react-email/components"

const style = /*css*/`
    .logo-container {
        display: flex;
        width: 100%;
        justify-content: center;
    }

    .logo {
        display: block;
        width: auto;
        height: 110px;
        margin-bottom: -13px;
    }

    .text-container {
        display: flex;
        width: 100%;
        justify-content: center;
    }

    .text {
        font-family: Tahoma, sans-serif;
        color: black;
        font-size: 20px !important;
    }

    .button-container {  
        display: table;
        text-align: center;
    }

    .button {
        margin: auto;
        margin-top: 10px;
        margin-bottom: 10px;
        background-color: #7e7aff;
        border: 2px solid black;
        padding: 0px 10px !important;
        width: max-content;
    }

    .button-text {
        font-family: Tahoma, sans-serif;
        color: black;
        font-weight: bold;
        font-size: 26px !important;
    }

    .button-text:hover {
        color: white;
    }
`

interface Props {
    username: string
    link: string
}

const ResetPassword = (props: Props) => {
    const {username, link} = props

    return (
        <Html lang="en">
            <Head><style>{style}</style></Head>
            <Preview>Moepictures Password Reset</Preview>
            <Body style={{width: "80%"}}>
                <Container className="logo-container">
                    <Link href="https://moepictures.moe"><Img className="logo" src="https://i.imgur.com/DGvZWgB.png"/></Link>
                </Container>
                <Container className="text-container">
                    <Text className="text">
                        Hi {username}, <br/><br/>
            
                        You recently made a request to reset your password. The link 
                        below will expire after one hour. *If the link doesn't work, take this email 
                        out of the spam folder. <br/>
                    </Text>
                </Container>
                <Container className="button-container">
                    <Button className="button" href={link}>
                        <Text className="button-text">Reset Password</Text>
                    </Button>
                </Container>
            </Body>
        </Html>
  )
}

export default ResetPassword
