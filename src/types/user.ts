export interface Credentials {
  userName: string
  password: string
}

export interface UserData extends Credentials {
  firstName?: string
  lastName?: string
}

export interface TokenResponse {
  token: string
  expires: string
  status: string
  result: string
}

export interface CreatedUserResponse {
  userID: string
  username: string
  books: UserBook[]
}

export interface UserBook {
  isbn: string
  title?: string
  subTitle?: string
  author?: string
  publish_date?: string
  publisher?: string
  pages?: number
  description?: string
  website?: string
}

export interface UserProfile {
  userId: string
  username: string
  books: UserBook[]
}

export interface AuthState {
  userId: string
  userName: string
  token: string
  password?: string
  expires?: string
  isLoggedIn?: boolean
}

export type StoredUserInfo = AuthState
