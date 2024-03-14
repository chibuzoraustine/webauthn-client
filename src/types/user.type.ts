export interface IAppContext {
    user: IUser | null,
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>,
    isAuthenticated: boolean,
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
}

export interface IUser {
    firstname: string,
    lastname: string,
    email: string
}