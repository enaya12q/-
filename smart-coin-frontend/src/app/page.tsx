'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Earn crypto by</span>
                    <span className="block text-indigo-600">watching ads</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Start earning cryptocurrency rewards by watching ads. Sign up now and earn $0.002 per ad view, up to $0.10 daily!
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        href="/auth"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                      </Link>
                    </div>
                    {/* New links from problematic section */}
                    <div className="flex gap-4 items-center flex-col sm:flex-row">
                      <a
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                        href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          className="dark:invert"
                          src="/vercel.svg"
                          alt="Vercel logomark"
                          width={20}
                          height={20}
                        />
                        Deploy now
                      </a>
                      <a
                        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                        href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          className="dark:invert"
                          src="/vercel.svg"
                          alt="Vercel logomark"
                          width={20}
                          height={20}
                        />
                        Read our docs
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                How it works
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {/* Feature 1 */}
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      1
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Watch Ads</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Watch ads for 30 seconds each and earn $0.002 per view.
                  </dd>
                </div>

                {/* Feature 2 */}
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      2
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Earn Rewards</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Earn up to $0.10 daily by watching 50 ads.
                  </dd>
                </div>

                {/* Feature 3 */}
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      3
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Refer Friends</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Earn 10% of your referrals' earnings forever.
                  </dd>
                </div>

                {/* Feature 4 */}
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      4
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Get Paid</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Withdraw your earnings to your crypto wallet.
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Banner Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
          <script
            async
            data-cfasync="false"
            src="//pl27623322.revenuecpmgate.com/07a0ea3dee3fc93775251a64a297df45/invoke.js"
          ></script>
          <div id="container-07a0ea3dee3fc93775251a64a297df45"></div>
        </div>
      </main>
      {/* Footer Section */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
