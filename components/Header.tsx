import Image from 'next/image'
import React from 'react'
import { Button } from './ui/button'
import Search from './Search'
import Fileuploader from './Fileuploader'
import { deleteSession } from '@/lib/actions/user.actions'

const Header = ({userId, accountId}: {userId: string; accountId: string}) => {
  return (
    <header className='header'>
        <Search/>

        <div className='header-wrapper'>
            <Fileuploader ownerId={userId} accountID={accountId}/>
          {/*form action... to perform server actions that seems to be client side */}
            <form action={async()=>{
              "use server";
              await deleteSession();}}>
                <Button className='sign-out-button' type="submit">
                    <Image src="/assets/icons/logout.svg" width={24} height={24} alt="logout" className='w-6'/>

                </Button>
            </form>
        </div>
    </header>
  )
}

export default Header