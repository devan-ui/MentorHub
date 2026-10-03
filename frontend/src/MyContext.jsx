
import React, { use, useState } from 'react'
import { createContext } from 'react'

export const MyContext = createContext();
export const MyContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    return (
        <MyContext.Provider value={{ user, setUser }}>
            {children}
        </MyContext.Provider>

    )
}

