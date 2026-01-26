"use client";

import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { Input } from './ui/input';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getFiles } from '@/lib/file.actions';
import { Models } from 'node-appwrite';
import Thumbnail from './Thumbnail';
import FormattedDateTime from './FormattedDateTime';
import { useDebounce } from 'use-debounce';

const Search = () => {
 const searchParams = useSearchParams();
 const searchQuery = searchParams.get('query') || '';
 const [query, setQuery] = useState(searchQuery);
 const [results, setResults] = useState<Models.Document[]>([]);
 const [open, setOpen] = useState(false);
 const router = useRouter();
 const path = usePathname();
 const [debouncedQuery] = useDebounce(query, 300);

 useEffect(() => {
    let active = true;

    if (debouncedQuery.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }

    const fetchFiles = async () => {
       setResults([]); // Clear previous results immediately to avoid "Ghosting"
      try {
        const { getSearchResults } = await import("@/lib/actions/semantic.actions");
        
        // Run both searches in parallel for best UX
        const [semanticResults, standardRes] = await Promise.all([
          getSearchResults(debouncedQuery).catch((err) => {
             console.error("Semantic search error:", err);
             return []; 
          }),
          getFiles({ types: [], searchText: debouncedQuery }).catch((err) => {
             console.error("Standard search error:", err);
             return { documents: [] };
          })
        ]);

        const standardResults = standardRes.documents || [];

        // Merge results (prevent duplicates)
        // Merge results (prevent duplicates)
        // We prioritize Standard results (Accuracy), then append Semantic results (Discovery)
        const combinedFiles = [...standardResults, ...semanticResults];
        
        // Deduplicate by $id
        const uniqueFiles = Array.from(new Map(combinedFiles.map(file => [file.$id, file])).values());

        if (active) {
          setResults(uniqueFiles);
          // Only open dropdown if the query changed from what's in the URL (user typing)
          // or if the user actively explicitly cleared it and typed again.
          // On page load/nav, query === searchQuery, so we keep it closed.
          if (query !== searchQuery) {
             setOpen(true);
          }
        }
      } catch (error) {
         console.error("Search failed:", error);
      }
    };

    fetchFiles();

    return () => {
        active = false;
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQuery = params.get("query") || "";

    if (debouncedQuery === currentQuery) return;

    if (debouncedQuery) {
      params.set("query", debouncedQuery);
    } else {
      params.delete("query");
    }

    router.replace(`${path}?${params.toString()}`, { scroll: false });
  }, [debouncedQuery]); // Only run when debounced query changes
  
  return (
    <div className='search'>
      <div className='search-input-wrapper'>
          <Image src="/assets/icons/search.svg" alt="search" width={24} height={24}/>

          <Input value={query} onChange={(e) => setQuery(e.target.value)} 
          placeholder='Search...'
          className='search-input'/>

          {query && (
              <Image 
                src="/assets/icons/remove.svg" 
                alt="Remove" 
                width={24} 
                height={24} 
                className='cursor-pointer'
                onClick={() => setQuery('')}
              />
          )}

          {open && (
            <ul className='search-result'>
                {results.length > 0 ? (
                    results.map((file: Models.Document | any) => (
                         <li key={file.$id} className='flex items-center justify-between p-2 hover:bg-light-400 cursor-pointer'
                          onClick={() => {
                            setOpen(false);
                            setResults([]);
                            router.push(`/${file.type === 'video' || file.type === 'audio' ? 'media' : file.type + 's'}?query=${file.name}`);
                          }}>
                            <div className='flex items-center gap-4 cursor-pointer'> 
                                <Thumbnail type={file.type} extension={file.extension} url={file.url} className='size-9 min-w-9'/>
                                <p className='subtitle-2 line-clamp-1 text-light-100'>{file.name}</p>
                            </div>
                            
                            <FormattedDateTime date={file.$createdAt} className='caption line-clamp-1 text-light-200'/>
                         </li>
                    ))
                ) : (
                    <p className='empty-result'>No files found</p>
                )}
            </ul>
          )}
      </div>
    </div>
  )
}

export default Search