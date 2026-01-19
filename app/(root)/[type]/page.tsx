import Card from '@/components/Card';
import Sort from '@/components/Sort';
import { getFiles } from '@/lib/file.actions';
import { Models } from 'node-appwrite';

import { getCurrentUserData } from '@/lib/actions/user.actions';
import { getFileTypesParams } from '@/lib/utils';

const page = async ({params, searchParams}: SearchParamProps) => {
  const type = ((await params)?.type as string) || "" ;
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";

  const types = getFileTypesParams(type) as FileType[];


    const [files, currentUser] = await Promise.all([
        getFiles({types, searchText, sort}),
        getCurrentUserData(),
    ]);


    return (
        <div className='"page-container'>
            <section className='w-full'>
                <h1 className='h1 capitalize'>{type}</h1>

                 <div className='total-size-section pb-3'>
                    <p className='body-1'>
                        Total Size: <span className='text-brand'>0 MB</span>
                    </p>

                        <div className='sort-container'>
                            <p className='body-1 hidden sm:block text-light-200 pb-2'>
                                Sort by:
                            </p>

                            <Sort/>
                        </div>
                 </div>

            </section>

            {/* Render files */}
            
            {files.total > 0 ? (
                <section className='file-list' >
                    {files.documents.map((file : Models.Document) => (
                    <Card key={file.$id} file={file} currentUser={currentUser} /> //passing props files == file means Card can access all properties of file
                    ))}
                </section>
            ) : (
                <p className='empty-list'>No files uploaded yet</p>
            )}
        </div>
  )
}

export default page