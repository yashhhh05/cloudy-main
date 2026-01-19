//Creating various models for different actions

import { Models } from "node-appwrite";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { formatDateTime } from "@/lib/utils";
import { Input } from "./ui/input";
import { email } from "zod";
import Image from "next/image";



const ImageThumbnail =({file}: {file: Models.Document | any}) => (
    <div className="file-details-thumbnail">
        <Thumbnail type={file.type} extension={file.extension} url={file.url}/>
        <div className="flex flex-col">
            <p className="subtitle-2 mb-1">{file.name}</p>
            <FormattedDateTime date={file.$createdAt} className="caption"/>
        </div>
    </div>
)

const DeatilRow =({label, value}: {label: string; value: string}) => (
    <div className="flex gap-2">
        <p className="file-details-label text-left">{label}</p>
        <p className="file-details-value text-left">{value}</p>
    </div>
)


export const FileDetailsModel = ({file}: {file: Models.Document | any}) => 
    {
    return (
        <>
            <ImageThumbnail file={file}/>
            <div className="space-y-4 pt-2 px-2">
            <DeatilRow label ="Format:" value={file.extension} />
            <DeatilRow label ="Size:" value={file.size} />
            <DeatilRow label ="Owner:" value={file.owner.fullName} />        
            <DeatilRow label ="Last edited:" value={formatDateTime(file.$updatedAt)} />
            </div>
        </>
    )
};



interface Props{
    file : Models.Document | any;
    onInputChange : React.Dispatch<React.SetStateAction<string[]>>;
    onRemoveUser : (email: string) => void;
    sharedEmails?: string[]; // New prop for local state
    currentUser?: any;
}

export const ShareInput = ({onInputChange, onRemoveUser, file, sharedEmails, currentUser}: Props) => {
    // Determine which list to show: passed prop or file.users fallback
    const currentUsers = sharedEmails ?? file.users;

  return (
    <>
      <ImageThumbnail file={file}/>

        <div className="share-wrapper">
            <p className="subtitle-2 pl-1 pb-2 text-light-100 text-center">
                Share with other users
            </p>
            
            <Input 
                type="email"
                placeholder="Enter email"
                onChange={(e)=>onInputChange(e.target.value.trim().split(","))} //if wanna share with multiple users
                className="share-input-field"
            />

            <div className="pt-4">
                <div className="flex justify-between">
                    <p className="subtitle-2 text-light-100">Shared with</p>
                    <p className="subtitle-2 text-light-200">{currentUsers.length} Users</p>
                </div>

                <div className="pt-2">
                    {currentUsers.map((user: string)=>(
                        <li key={user} className="flex items-center justify-between gap-2">
                            <p className="subtitle-2">{user} {user === file.owner.email && "(Owner)"}</p>
                            {/* left side X button to remove user */}
                            {user !== file.owner.email ? (
                            <button onClick={()=>onRemoveUser(user)} className="share-remove-user cursor-pointer">
                                <Image src="/assets/icons/remove.svg" alt="Remove" width={24} height={24} 
                                className="remove-icon"/>
                            </button>
                            ) : null}
                        </li>
                    ))}
                </div>
            </div>

        </div>
    </>
  )
}


