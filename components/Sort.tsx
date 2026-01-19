"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sortTypes } from "@/constants";
import { usePathname, useRouter } from "next/navigation";

const Sort = () => {

  const path = usePathname();
  const router = useRouter();
  const handleSort = (value: string) => {
    router.push(`${path}?sort=${value}`); // start with path then route to that value
  }


  return (
    <Select onValueChange={handleSort} defaultValue={sortTypes[0].value}>
     <SelectTrigger className="sort-select">
        <SelectValue placeholder={sortTypes[0].value} />
      </SelectTrigger>
        <SelectContent className="bg-white border-0 rounded-xl sort-select-content">
          {sortTypes.map((sortType) => (
            <SelectItem
            className="shad-select-item"
             key={sortType.label}
             value={sortType.value}>
              {sortType.label}
            </SelectItem>
          ))}
       </SelectContent>
</Select>
  )
}

export default Sort