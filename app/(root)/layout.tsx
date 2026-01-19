import Header from "@/components/Header"
import MMobilenav from "@/components/MMobilenav"
import SIdebar from "@/components/SIdebar"
import { getCurrentUserData } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner"

const layout = async({children}: {children: React.ReactNode}) => {
  

  const currentUser = await getCurrentUserData();

  if(!currentUser){
    return redirect("/sign-in");
  }

  
  return (
    <main className='flex h-screen'>
      <SIdebar {...currentUser}/> {/*spreading currentUSer to pass all info to sidebar as props */}
        <section className='flex h-full flex-1 flex-col'>
          <MMobilenav {...currentUser} ownerId={currentUser.$id} accountID={currentUser.accountId}/>
          <Header userId={currentUser.$id} accountId={currentUser.accountId}/>
            <div className='main-content'>
                {children}
            </div>
        </section>
        <Toaster />
    </main>
  )
}

export default layout