// import type { Metadata } from "next";
// import Icon from "@/components/ui/Icon";
// import Image from "next/image";

// export const metadata: Metadata = {
//   title: "Dashboard",
// };

// export default function Home() {
//   return (
//     <div className="space-y-6">
//       <section className="rounded-2xl border border-default bg-surface p-8 shadow-xl shadow-default md:p-12">
//         <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
//           <div>
//             <h1 className="max-w-3xl text-4xl font-semibold text-foreground md:text-3xl">
//               Start WhatsApp Engagement for your Business
//             </h1>
//             <p className="mt-4 max-w-xl text-base leading-7 text-muted">
//               Apply for WhatsApp Business API or migrate from another provider.
//             </p>
//             <div className="mt-8 flex flex-wrap gap-4">
//               <button className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-strong">
//                 <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
//                   <Icon name="ri:send-plane-line" size={14} color="currentColor" />
//                 </span>
//                 Apply for WhatsApp Business API (FREE)
//               </button>
//               <button className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold transition hover:bg-surface-strong">
//                 <span>Migrate from Another Vendor</span>
//                 <Icon name="ri:arrow-up-line" size={18} className="rotate-45" />
//               </button>
//             </div>
//             <p className="mt-10 text-base text-foreground">
//               Want to know more about NeroChat? Click to schedule a Live Demo.
//             </p>
//           </div>

//           <div className="mx-auto hidden w-full max-w-xs lg:block">
//             <Image
//               src="/rocket_icon.png"
//               alt="Rocket icon"
//               width={140}
//               height={140}
//               className="mx-auto object-contain"
//             />
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }























"use client";

import { useEffect } from "react";
import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import Image from "next/image";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (options: Record<string, unknown>) => void;
      login: (callback: (response: any) => void, options: Record<string, unknown>) => void;
    };
  }
}

const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || "";
const metaConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID || "";
const metaAuthUrl = process.env.NEXT_PUBLIC_META_AUTH_URL || "";

export default function Home() {

  useEffect(() => {

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: metaAppId,
        cookie: true,
        xfbml: true,
        version: "v22.0",
      });
    };

    const script = document.createElement("script");

    script.src = "https://connect.facebook.net/en_US/sdk.js";

    script.async = true;
    script.defer = true;

    document.body.appendChild(script);

  }, []);

  const launchWhatsAppSignup = () => {

    window.FB.login(
       function (response: any) {

        console.log("META RESPONSE:", response);

        if (response.authResponse) {

          const code = response.authResponse.code;

          console.log("AUTH CODE:", code);

           fetch(metaAuthUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
            }),
          });

        }
      },
      {
        config_id: metaConfigId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          feature: "whatsapp_embedded_signup",
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-default bg-surface p-8 shadow-xl shadow-default md:p-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">

          <div>

            <h1 className="max-w-3xl text-4xl font-semibold text-foreground md:text-3xl">
              Start WhatsApp Engagement for your Business
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Apply for WhatsApp Business API or migrate from another provider.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <button
                onClick={launchWhatsAppSignup}
                className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-strong"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                  <Icon
                    name="ri:send-plane-line"
                    size={14}
                    color="currentColor"
                  />
                </span>

                Apply for WhatsApp Business API (FREE)

              </button>

              <button className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold transition hover:bg-surface-strong">

                <span>Migrate from Another Vendor</span>

                <Icon
                  name="ri:arrow-up-line"
                  size={18}
                  className="rotate-45"
                />

              </button>

            </div>

            <p className="mt-10 text-base text-foreground">
              Want to know more about NeroChat? Click to schedule a Live Demo.
            </p>

          </div>

          <div className="mx-auto hidden w-full max-w-xs lg:block">
            <Image
              src="/rocket_icon.png"
              alt="Rocket icon"
              width={140}
              height={140}
              className="mx-auto object-contain"
            />
          </div>

        </div>
      </section>
    </div>
  );
}
