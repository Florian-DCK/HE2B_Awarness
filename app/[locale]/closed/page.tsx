"use client";

import He2bBar from "../../components/He2bBar";
import Footer from "../../components/Footer";

export default function ClosedPage() {
  return (
    <main className="min-h-[100dvh] bg-white">
      <He2bBar />
      <div className="mx-auto flex min-h-[80dvh] w-full max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
        <img
          src="/assets/diplomePoulpe.png"
          alt="Poulpe HE2B"
          className="float h-24 w-24 object-contain"
        />
        <h1 className="text-he2b text-3xl font-extrabold uppercase">
          Le stand revient vite !
        </h1>
        <p className="text-sm text-gray-500">
          Le site est ouvert de <span className="font-semibold">10h à 18h</span>.
        </p>
        <div className="rounded-2xl bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700 shadow-sm">
          Passe nous voir pendant les horaires d'ouverture pour tenter ta chance.
        </div>
      </div>
      <Footer />
    </main>
  );
}
