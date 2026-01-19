// Here we combining dropdown and dialog components

"use client";

import { Models } from 'node-appwrite';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { actionsDropdownItems } from '@/constants';
import Link from 'next/link';
import { constructDownloadUrl } from '@/lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { renameFile, updateFileUsers, deleteFile } from '@/lib/file.actions';
import { FileDetailsModel, ShareInput } from './ContentDetailModel';




const ActionDropdown = ({file, currentUser}: {file: Models.Document | any, currentUser: any}) => {
  
   const [isModelOpen, setIsModelOpen] = useState(false);
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const [action, setAction] = useState<ActionType | null>(null);
   const[newFileName, setNewFileName] = useState(file.name);
   const [isLoading, setIsLoading] = useState(false);
   const path = usePathname();

    //arrays of emails to share
    const [emails, setEmails] = useState<string[]>([]); 
    // State to manage shared users locally before saving
    const [sharedPeople, setSharedPeople] = useState<string[]>(file.users);

    useEffect(() => {
        setSharedPeople(file.users);
    }, [file]);

   //Clear every changes
   const clearChanges = () => {
    setAction(null);
    setIsModelOpen(false);
    setIsDropdownOpen(false);
    setNewFileName(file.name);
    //setEmails([]);
   }

   //okeiing
   const handleChange=async()=>{
        if(!action) return;
        setIsLoading(true);

        let success = false;

        const actions = {

            rename: () => 
             renameFile({
                fileId: file.$id,
                name: newFileName,
                extension: file.extension,
                path,
             }),

             share : () => {
                const newUsers = [...(sharedPeople || []), ...emails];
                return updateFileUsers({
                    fileId: file.$id,
                    emails: newUsers,
                    path,
                }) 
             },

             delete : () => {
                 return deleteFile({
                    fileId: file.$id,
                    bucketFileId: file.bucketFileId,
                    path,
                 })
             },

     
        }


        success = await actions[action.value as keyof typeof actions]();
        if(success) clearChanges();
        setIsLoading(false);
   }

  // Remove user from sharing functionality
  const handleRemoveUSer =async (email: string) => {
    const updatedEmails = sharedPeople.filter((e) => e !== email);
    setSharedPeople(updatedEmails);
    
    // If you want immediate server update without clicking "Share":
    /*
    await updateFileUsers({
        fileId: file.$id,
        emails: updatedEmails,
        path,
    });
    */
    // But based on UI (Cancel/Share buttons), we probably wait for "Share" click,
    // OR we can do optimistic update + server call if "Share" button is only for *adding*?
    // The previous code had `updateFileUsers` inside `actions.share`.
    // The UI shows "Share" button.
    // If I remove a user, the list updates visually (via sharedPeople).
    // Then clicking "Share" button will save `sharedPeople` + `emails` (newly added).
    // This seems correct for a transactional modal.
  }



    const renderDialogContent = () => {

        if (!action) return null;

        const {label, value} = action;

        return (
            <DialogContent className='shad-dialog button '>
                <DialogHeader className='flex flex-col gap-3'>
                <DialogTitle className='text-center text-light-100'>{label}</DialogTitle>
                 {value === "rename" && (
                    <Input type='text' value={newFileName}
                     onChange={(e) => setNewFileName(e.target.value)}
                    />
                 )}

                 {value === "details" && (
                    < FileDetailsModel file={file}/>

                 )}
                 {value === "share" && (
                    <ShareInput 
                        file={file} 
                        onInputChange={setEmails} 
                        onRemoveUser={handleRemoveUSer}
                        sharedEmails={sharedPeople}
                        currentUser={currentUser}
                    /> 
                 )}
                 {value === "delete" && (
                    <p className='delete-confirmation'>
                        Are you sure you want to delete{` `}
                        <span className='delete-file-name'>{file.name}</span>
                    </p>
                 )}
                </DialogHeader>
                {["rename","delete", "share"].includes(value) && (
                    <DialogFooter className='flex gap-3 flex-col md:flex-row md:gap-0'>
                        <Button onClick={clearChanges} className='modal-cancel-button'>Cancel</Button>
                        <Button onClick={handleChange} className='modal-submit-button'>
                            <p className='capitalize flex justify-between gap-3'>
                                {value}
                                {isLoading && (
                                    <Image src="/assets/icons/loader.svg" alt="loader" width={24} height={24} className='animate-spin'/>
                                )}
                        </p></Button>
                        
                    </DialogFooter>
                )}
            </DialogContent>
        )
    }

    return (
    
        <Dialog open={isModelOpen} onOpenChange={setIsModelOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger className='shad-no-focus'>
                    <Image src="/assets/icons/dots.svg" alt="dots" width={34} height={34}/>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white shadow-xl rounded-xl border-white  ">
                    <DropdownMenuLabel className='max-w-[200px] truncate'>{file.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {actionsDropdownItems.map((actions)=>(
                        <DropdownMenuItem key={actions.value} className='shad-dropdown-item'
                        onClick={()=> {
                            setAction(actions);

                        // The if means to choose different models like if we choose rename then it will open rename model
                        if([
                            "rename",
                            "share",
                            "delete",
                            "details"
                        ].includes(actions.value)){
                            setIsModelOpen(true);
                        }
                        }}
                        >
                            {actions.value === "download" ? (
                                //for download action
                                <Link href={constructDownloadUrl(file.bucketFileId)}
                                 download={file.name}
                                 className='flex items-center gap-2'>
                                <Image src={actions.icon} alt={actions.label} width={30} height={30}/>
                                {actions.label}
                            </Link>
                            ) : (
                               <div className='flex items-center gap-2'>
                                <Image src={actions.icon} alt={actions.label} width={30} height={30}/>
                                {actions.label}
                               </div>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
         </Dialog>
    
  )
}

export default ActionDropdown