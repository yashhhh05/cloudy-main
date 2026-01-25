"use client";

import Image from 'next/image'


import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { avatarUrl, navItems } from '@/constants';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import Fileuploader from './Fileuploader';
import { deleteSession } from '@/lib/actions/user.actions';

const MMobilenav = ({ownerId,accountID,fullName,avatar,email}: {ownerId: string; accountID: string; fullName: string; avatar: string; email: string}) => {

    const [open, setOpen] = useState(false);
    const pathname = usePathname();

  return (
    <header className='mobile-header'>
        <Image src="/Mystic (1).png" width={60} height={60} alt="logo" className='h-auto'/>
        
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger>
                <Image src="/assets/icons/menu.svg" width={30} height={30} alt="Search"/>
            </SheetTrigger>
            <SheetContent className='shad-sheet h-screen px-3'>
                <SheetTitle>
                  <div className='header-user'>
                    <Image src={avatar} alt="avatar" width={44} height={44} className='header-user-avatar'/>
                    <div className='sm:hidden lg:block'>
                         <p className='subtitle-2 capitalize'>{fullName}</p>
                         <p className='caption'>{email}</p>
                    </div>
                   </div>
                   <Separator className='mb-4 bg-light-200/20'/>
                   <SheetDescription className='hidden'>Mobile Navigation</SheetDescription>
                </SheetTitle>
               <nav className='mobile-nav'>
                 <ul className='mobile-nav-list'>
                     {navItems.map((item)=>(
                <Link key={item.name} href={item.url} className='lg:w-full'>
                   <li className={cn("mobile-nav-item", pathname === item.url && "shad-active")}>
                      <Image src={item.icon} width={24} height={24} alt={item.name}
                      className={cn('nav-icon', pathname === item.url && "nav-icon-active")}/>
                      <span>{item.name}</span>
                   </li>
                </Link>
               ))}
                 </ul>
                
               </nav>
               <Separator className='my-5 bg-light-200/20'/>
               <div className='flex flex-col justify-between p-5 gap-5'>
                <Fileuploader ownerId={ownerId} accountID={accountID}/>

                 
                <Button className='mobile-sign-out-button' type="submit" onClick={async()=>await deleteSession()}>
                    <Image src="/assets/icons/logout.svg" width={24} height={24} alt="logout" />
                    <p>Sign out</p>  
                </Button>

               </div>
            </SheetContent>
        </Sheet>


    </header>
  )
}

export default MMobilenav