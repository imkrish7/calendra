"use client"
import React from 'react'
import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { neobrutalism } from '@clerk/themes'

const HomePage = () => {
  return (
      <main className='flex items-center p-10 gap-24 animate-fade-in max-md:flex-col'>
          <section className='flex flex-col items-center'>
              <Image src="/assets/logo.svg" width={100} height={100} alt="logo" />
              <h1 className='text-2xl font-black lg:text-3xl'>
                  Your time perfectly planned
              </h1>
              <p className='font-extralight'>
                  Join millions of professional who easily book meeting with the #1 scheduling app
              </p>
              <Image src="/assets/planning.svg" width={500} height={500} alt="logo" />

          </section>
          <div className='mt-3'>
              <SignIn routing='hash' appearance={{
                            baseTheme: neobrutalism
                        }} />
                    </div>
    </main>
  )
}

export default HomePage