"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "./ui/button"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import React, { useState } from "react";
import Image from "next/image";
import { sendEmailOTP, verifySecret } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const OPTmodal = ({email, accountId}: {email: string, accountId: string}) => {
  //once we have accountID we alway wanna show it/ already visible
    const router = useRouter();
    const [open, setOpen] = useState(true);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event : React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            //Call API to verify the OTP or verified secret server action
            const sessionId = await verifySecret({password, accountId});
            if(sessionId){
                router.push("/");

            }

        } catch (error) {
            console.error("Failed to verify OTP:", error);
            setError("Failed to verify OTP. Please try again.");
        }
        //whatever happens we aint performing OPT Action anymore
        setIsLoading(false);
    }

    const handleResendOTP = async () => {
        try{
            //call API to resend OTP
            await sendEmailOTP(email);
        }catch(e){
            console.error("Failed to resend OTP:", e);
            setError("Failed to resend OTP. Please try again.");
        }
        
    }


  return (
     <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="shad-alert-dialog "> 
                    <AlertDialogHeader className="relative flex justify-center">
                        <AlertDialogTitle className="h2 text-center">
                            Verify OTP
                            <Image src="/assets/icons/close-dark.svg" width={20} height={20} alt="close"
                              onClick={()=> setOpen(false)}
                              className="otp-close-button"/>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="subtitle-2 text-center text-light-100">
                           We've sent a code to <span className="pl-1 text-brand">{email}yashd@gmail.com</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                <InputOTP maxLength={6} value={password} onChange={setPassword}>
                    <InputOTPGroup className="shad-otp">
                        <InputOTPSlot index={0} className="shad-otp-slot"/>
                        <InputOTPSlot index={1} className="shad-otp-slot"/>
                        <InputOTPSlot index={2} className="shad-otp-slot"/>
                        <InputOTPSlot index={3}className="shad-otp-slot" />
                        <InputOTPSlot index={4} className="shad-otp-slot"/>
                        <InputOTPSlot index={5} className="shad-otp-slot"/>
                    </InputOTPGroup>
                </InputOTP>

            <AlertDialogFooter>
                <AlertDialogAction onClick={handleSubmit} type="button">
                    Submit
                    {isLoading&& (
                        <Image src="/assets/icons/loader.svg" width={24} height={24} 
                        alt="loader"
                        className="ml-2 animate-spin"/>
                    )}
                </AlertDialogAction>
            </AlertDialogFooter>
            <div className="subtitle-2 text-center text-light-100">
                Did't receive the code?
                <Button className="pl-2" type="button" onClick={handleResendOTP} variant={"link"}>
                    Click to Resend
                </Button>
            </div>
        </AlertDialogContent>
    </AlertDialog>
  )
}

export default OPTmodal