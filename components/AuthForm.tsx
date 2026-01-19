"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createAccount, signInUser } from "@/lib/actions/user.actions";
import OPTmodal from "./OPTmodal";

const AuthformSchema =(formType : 'sign-in' | 'sign-up') => {
    return z.object({
        email: z.string().email({ message: "Invalid email address" }),
        fullName : formType === 'sign-up' ? z.string().min(3, { message: "Username must be at least 3 characters long" }) : z.string().optional(),
    });
};

//prop type is of type
const AuthForm = ({type}: {type: 'sign-in' | 'sign-up'}) => {
    
    //useState for loading
    const [isLoading, setIsLoading] = useState(false);

    //for error
    const [errorMessage, setErrorMessage] = useState('');
    const [accountId, setAccountId] = useState(null);

    //Form schema
    const formSchema = AuthformSchema(type);

    //Define form
    const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  })

  //Submit handler
  const onSubmit =async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try
    {
        const user =    
        type === 'sign-up' ? await createAccount({
            fullName: values.fullName || "",
            email: values.email
        }) : await signInUser({email: values.email});
    
        setAccountId(user.accountId);
    }
    catch (error) {
        console.error("Authentication failed:", error);
        setErrorMessage(error instanceof Error ? error.message : "Failed to create account. Please try again");
    }
    finally{
        setIsLoading(false);
    }
    
  }
  
  
  
    return (
        <>
        
        <Form {...form}>
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="auth-form"
        >
            <h1 className="form-title">{type === 'sign-in' ? 'Sign in' : 'Sign up'}</h1>
            {type === "sign-up" && (
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                    <div className="shad-form-item">
                        <FormLabel className="shad-form-label">Full Name</FormLabel>
                        <FormControl>
                            <Input className="shad-input" placeholder="Enter your full name" {...field} />
                        </FormControl>
                    </div>
                        <FormMessage className="shad-form-message"/>
                </FormItem>
            )}
            />)}

             <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <div className="shad-form-item">
                        <FormLabel className="shad-form-label">Email</FormLabel>
                        <FormControl>
                            <Input className="shad-input" placeholder="Enter your email" {...field} />
                        </FormControl>
                    </div>
                        <FormMessage className="shad-form-message"/>
                </FormItem>
            )}
            />

            {/* Submit button */}
            <Button type="submit" className=" form-submit-button  hover:bg-red-500/80 " disabled={isLoading}>
            <p className="text-white">{type == "sign-in" ? "Sign in" : "Sign up"}</p>
            {isLoading && (
                <Image src="/assets/icons/loader.svg" width={24} height={24} alt="loader"className="animate-spin ml-2"/>
            )}
            </Button>

            {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
            )}
            <div className="body-2 flex justify-center" >
                <p className="text-light-100">
                {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"
                }
                </p>
                <Link href={type === "sign-in" ? "/sign-up" : "/sign-in"} className="ml-1 font-medium text-brand">
                {type === "sign-in" ? "Sign up" : "Sign in"}
                </Link>
            </div>
            
        </form>
        </Form>
        {/*OTP modal for verification only on sign up page */}
        {/*authform itself  sign up page */}
        {/*accountId is the user id  means user is trying to verify themsleves*/}
        {accountId && (
            <OPTmodal 
            email={form.getValues("email")}
            accountId={accountId}/>
        )}  
        

    </>
  );


}

export default AuthForm