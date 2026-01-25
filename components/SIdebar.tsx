"use client";

import { avatarUrl, navItems } from '@/constants'
import { cn } from '@/lib/utils';
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation' //for getting current path means where we are rn
import React from 'react'

const SIdebar = ({fullName, email, avatar}: {fullName: string; email: string; avatar: string}) => {

    const pathname = usePathname();

  return (
    <aside className='sidebar'>
        <Link href="/">
             <Image src="/Mystic (1).png" width={90} height={45} alt="home" className='hidden h-auto lg:block' />
             <Image src="/Mystic (1).png" width={50} height={50} alt="home" className='lg:hidden' /> {/* image for mobile screen */}
        </Link>

        <nav className='sidebar-nav'>
            <ul className='flex flex-1 flex-col gap-6'>
               {navItems.map((item)=>(
                <Link key={item.name} href={item.url} className='lg:w-full'>
                <li className={cn("sidebar-nav-item", pathname === item.url && "shad-active")}>
                      <Image src={item.icon} width={24} height={24} alt={item.name}
                      className={cn('nav-icon', pathname === item.url && "nav-icon-active")}/>
                      <span className='hidden lg:block'>{item.name}</span>
                   </li>
                </Link>
               ))}
            </ul>
        </nav>

          <Image src = "/assets/images/files-2.png" width={506} height={418} alt="files" className='w-full max-md:hidden hover:rotate-2 hover:scale-110 transition-all'/>
          
             <div className='sidebar-user-info'>

                {/*we using static avatar cuz our app isnt that user based like social media where we need to change avatar for each user, we just care about users uploaded data */}
                <Image src={avatarUrl} width={44} height={44} alt="avatar" className='sidebar-user-avatar'/>
                
                <div className='hidden lg:block'>
                     <p className='subtitle-2 capitalize'>{fullName}</p>
                     <p className='text-sm text-gray-500'>{email}</p>
                </div>

             </div>

    </aside>
  )
}

export default SIdebar