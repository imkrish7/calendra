import PrivateNavbar from '@/components/PrivateNavbar';
import PublicNavbar from '@/components/PublicNavbar';
import { currentUser } from '@clerk/nextjs/server'
import React, { FC, ReactNode } from 'react'

interface IProps {
    children: ReactNode
}

const Layout: FC<IProps> = async ({ children }) => {
    const user = await currentUser();
    return (<main className='relative'>
        {user ? <PrivateNavbar />: <PublicNavbar />}
        <section className='pt-36'>
            {children}
        </section>
  </main>
  )
}

export default Layout