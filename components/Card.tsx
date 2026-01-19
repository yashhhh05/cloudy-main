import Link from 'next/link'
import { Models } from 'node-appwrite'
import React from 'react'
import Thumbnail from './Thumbnail'
import { convertFileSize, constructImageUrl } from '@/lib/utils'
import FormattedDateTime from './FormattedDateTime'
import ActionDropdown from './ActionDropdown'

const Card = ({file, currentUser}: {file: Models.Document | any, currentUser: any}) => {
  const isOwner = file.owner.fullName === currentUser.fullName; // Ideally compare IDs but file.owner is populated with user doc which has ID? 
  // Wait, in getFiles, we populate owner.
  // file.owner is a User document. currentUser is a User document.
  // Compare file.owner.$id (from populated doc) vs currentUser.$id?
  // file.owner in Card is populated.
  // Let's check Card.tsx line 33: file.owner.fullName.
  // So file.owner is an object.
  // But wait, in file.actions.ts: populatedDocuments returns { ...file, owner }.
  // So file.owner is the User Document of the owner.
  
  // Checking ownership:
  // owner.$id vs currentUser.$id. (Users collection IDs).
  // OR accountId?
  // file.owner.accountId vs currentUser.accountId ?

  // Let's assume file.owner.$id works as User Collection ID.
  
  return (
    <Link href={file.url} target="_blank" className='file-card'>
        <div className='flex justify-between'>
            <Thumbnail
             type={file.type}
             extension={file.extension}
             url={file.url}
             className="size-20!"
             imageClassname="size-11!"
            />

            <div className='flex justify-between flex-col items-end'>
                <ActionDropdown file={file} currentUser={currentUser}/>
                <p className='body-1'>{convertFileSize(file.size)}</p> 
            </div>
        </div>

        <div className='file-card-details'>
            <p className='subtitle-2 line-clamp-1'>{file.name}</p>
            <FormattedDateTime 
             date = {file.$createdAt}
             className="body-2 text-light-100"/>

             <p className='caption line-clamp-1 text-light-200'>By: {file.owner.fullName}</p>
             <div className='flex items-center gap-2'>
              {file.owner.fullName === currentUser.fullName ? (
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>Owner</span>
              ) : (
                  <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>Shared</span>
              )}
             </div>
        </div>
    </Link>
  )
}

export default Card