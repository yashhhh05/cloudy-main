import { cn, getFileIcon } from '@/lib/utils';
import Image from 'next/image';

const Thumbnail = ({type,extension,url="",className,imageClassname}: {type: string, extension: string, url?: string, className?: string, imageClassname?: string}) => {
  const isImage = type === "image" && extension !== "svg";

  return(
    <figure className={cn("thumbnail", className)}>
        <Image src={isImage ? url: getFileIcon(extension,type)} alt="thumbnail" width={100} height={100}
        className={cn("size-8 object-contain", imageClassname, isImage && "thumbnail-image")}/>
    </figure>
  )
}

export default Thumbnail