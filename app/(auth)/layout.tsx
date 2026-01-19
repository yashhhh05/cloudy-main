import Image from "next/image";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left side illustration panel (visible on lg+) hidden*/}
      <section className="bg-brand p-10 hidden lg:flex lg:w-1/2 xl:w-2/5 items-center justify-center">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
          <div className="flex flex-row gap-2 items-center">
            <Image
              src="/Logo.svg"
              alt="logo"
              height={90}
              width={90}
              className="h-auto"
            />
            <h1 className="text-5xl font-bold text-white">Cloudy</h1>
          </div>

          <div className="space-y-5 text-white">
            <h1 className="text-3xl font-bold">Manage your files the best way</h1>
            <p className="text-sm">The only storage solution you need</p>
          </div>

          <div className="py-5 transition-transform hover:rotate-2 hover:scale-110">
            <Image
              src="/illustration.png"
              alt="illustration"
              height={342}
              width={342}
              className="h-auto"
            />
          </div>
        </div>
      </section>

      {/* Right side (children content) */}
      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden flex items-center gap-4 bg-brand p-2 rounded-full">
          <Image
            src="/Logo.svg"
            alt="logo"
            height={82}
            width={82}
            className="h-auto w-[82px]"
          />
          <h1 className="text-3xl font-bold text-white">Cloudy</h1>
        </div>
        {children}
      </section>

      
    </div>
  );
};

export default AuthLayout;