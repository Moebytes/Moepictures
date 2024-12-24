export interface EmailToken {
    email: string
    token: string
    expires: string
}

export interface $2FAToken {
    username: string
    token: string
    qrcode: string
}

export interface PasswordToken {
    username: string
    token: string
    expires: string
}