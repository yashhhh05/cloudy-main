"use client"

import React, {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import { Button } from './ui/button'
import { cn, convertFileToUrl } from '@/lib/utils'
import Image from 'next/image'

import { getFileType } from '@/lib/utils'
import Thumbnail from './Thumbnail'
import { MAX_FILE_SIZE } from '@/constants'
import { toast } from "sonner"
import { usePathname } from 'next/navigation'
import { uploadFiles } from '@/lib/file.actions'

const Fileuploader = ({ownerId, accountID, className}: {ownerId: string, accountID: string, className?: string}) => {
  const path = usePathname();
  
  //usestate to keep track of files
  const [files,setFiles] = useState<File[]>([])

  const handleRemoveFile = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, fileName: string) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((file) => file.name !== fileName)); //keep all files except the one that was clicked
  };
  
  const onDrop = useCallback( async (acceptedFiles: File[]) => {
       setFiles(acceptedFiles);

       const uploadPromises = acceptedFiles.map(async(file)=>{
        if(file.size > MAX_FILE_SIZE){
            setFiles((prev)=> prev.filter((f) => f.name !== file.name));
            
            return toast.warning("File size exceeds the maximum limit of 50MB");
        }

        try {
            const uploadedFile = await uploadFiles({file, ownerId, accountID, path});
            
            if(uploadedFile) {
                setFiles((prev) => prev.filter((f) => f.name !== file.name));
            }
            toast.success("File uploaded successfully");
        } catch (error) {
            setFiles((prev) => prev.filter((f) => f.name !== file.name));
            toast.error("Failed to upload file");
        }
    })
    
    await Promise.all(uploadPromises);
  }, [ownerId, accountID, path])

  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} className='cursor-pointer' />
      <Button type="button"
       className={cn("uploader-button", className)}>
        <Image src="/assets/icons/upload.svg" alt="upload" width={24} height={24}/> 
        <p className='font-semibold'>Upload</p>
       </Button>
      {files.length > 0 && (
        <ul className='uploader-preview-list'>
             <h4 className='h4 text-light-100'>Uploading</h4>
             
            {files.map((file,index)=>{
                const {type,extension} = getFileType(file.name);
                return(
                    <li key={`${file.name}-${index}`}
                    className='uploader-preview-item'>
                       <div className='flex items-center gap-3'>
                            <Thumbnail type={type} extension={extension} url={convertFileToUrl(file)}/> {/*component that renders preview of files */}
                       <div className='preview-item-name'>
                        {file.name}
                        <Image src="/assets/icons/file-loader.gif" width={80} height={26} alt="Loader" className='h-auto w-auto' />
                       </div>          
                       </div>

                       <Image src="/assets/icons/remove.svg" alt="delete" width={24} height={24} onClick={(e)=> handleRemoveFile(e, file.name)}/>

                    </li>
                )
            })}

        </ul>
      )}
       
    </div>
  )
}

export default Fileuploader