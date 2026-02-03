"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import SkinSelector from "../components/SkinSelector";
import DifficultySelector from "../components/DifficultySelector";
import CTAButton from "../components/CTAButton";
import He2bBar from "../components/He2bBar";
import Footer from "../components/Footer";
import { getDailyPrefixFromPathname } from "@/lib/daily-token-client";

export default function Home() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const dailyPrefix = getDailyPrefixFromPathname(pathname);
  const SKINS = {
    diplome: {
      id: "diplome",
      name: "Diplômé",
      description: '"Prêt pour la remise des diplômes !"',
      speedMod: 1,
      spawnMod: 1,
      image: "/assets/diplomePoulpe.png",
    },
    travail: {
      id: "travail",
      name: "Studieux",
      description: '"Multi-tâches niveau expert."',
      speedMod: 0.9,
      spawnMod: 1.1,
      image: "/assets/travailPoulpe.png",
    },
    bibliothecaire: {
      id: "bibliothecaire",
      name: "Biblio",
      description: '"8 bras = 8 livres."',
      speedMod: 1,
      spawnMod: 1,
      catchWindow: 1.2,
      image: "/assets/bibliothecairePoulpe.png",
    },
    ecole: {
      id: "ecole",
      name: "A%tudiant",
      description: '"Direction les cours !"',
      speedMod: 1.1,
      spawnMod: 0.9,
      image: "/assets/ecolePoulpe.png",
    },
    surf: {
      id: "surf",
      name: "Surfeur",
      description: '"Surfer sur les deadlines."',
      speedMod: 1.15,
      spawnMod: 0.85,
      image: "/assets/surfPoulpe.png",
    },
  } as const;
  type SkinKey = keyof typeof SKINS;
  const [selectedSkinId, setSelectedSkinId] = useState<SkinKey>("diplome");
  const [difficulty, setDifficulty] = useState<string>("⚡ Normal");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pseudo: "",
  });
  const [formError, setFormError] = useState("");
  const [hasRegistration, setHasRegistration] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const selectedSkin = SKINS[selectedSkinId];
  const PSEUDO_ADJECTIVES = [
    "Tentaculaire",
    "Studieux",
    "Focus",
    "Brave",
    "Curieux",
    "Vif",
    "Zen",
    "Agile",
    "Malin",
    "He2b",
    "Campus",
    "Royal",
    "Bruxellois",
    "Academique",
    "Diplome",
    "Motivant",
    "Tenace",
    "Endurant",
    "Energique",
    "Concentre",
    "Creatif",
    "Astucieux",
    "Lumineux",
    "Optimiste",
    "Solide",
    "Rapide",
    "Fute",
    "Calme",
    "Curieusement",
    "Audacieux",
    "Studieuse",
    "Methodique",
    "Ponctuel",
    "Bienveillant",
    "Solaire",
    "Epique",
    "Nomade",
    "Octo",
    "Poulpy",
  ];
  const PSEUDO_NOUNS = [
    "Poulpy",
    "Poulpe",
    "Poulpyx",
    "Poulpito",
    "Poulpissime",
    "Poulpex",
    "PoulpyOne",
    "Poulpito",
    "Poulpiz",
    "Poulpo",
    "Poulpito",
  ];
  const readCookie = (name: string) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length < 2) return "";
    const raw = parts.pop()?.split(";").shift() ?? "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };
  const writeCookie = (name: string, value: string, days = 180) => {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  };
  const generatePseudo = () => {
    const adjective =
      PSEUDO_ADJECTIVES[Math.floor(Math.random() * PSEUDO_ADJECTIVES.length)];
    const noun = PSEUDO_NOUNS[Math.floor(Math.random() * PSEUDO_NOUNS.length)];
    const number = Math.floor(10 + Math.random() * 90);
    return `${adjective} ${noun} ${number}`;
  };
  const getDifficultyValue = (label: string) => {
    if (label.toLowerCase().includes("difficile")) return "3";
    if (label.toLowerCase().includes("normal")) return "2";
    return "1";
  };
  const handleStart = () => {
    setFormError("");
    if (isLimitReached) {
      router.push(`/${locale}/scoreboard?limit=1`);
      return;
    }
    if (hasRegistration) {
      router.push(
        `${dailyPrefix}/${locale}/game?skin=${selectedSkinId}&difficulty=${getDifficultyValue(
          difficulty,
        )}`,
      );
      return;
    }
    setForm((prev) => ({
      ...prev,
      pseudo: prev.pseudo || generatePseudo(),
    }));
    setIsModalOpen(true);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const trimmed = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      pseudo: form.pseudo.trim(),
    };
    if (
      !trimmed.firstName ||
      !trimmed.lastName ||
      !trimmed.email ||
      !trimmed.pseudo
    ) {
      setFormError("Merci de compléter tous les champs.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      setFormError("Merci d'entrer un email valide.");
      return;
    }
    setIsSubmitting(true);
    fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trimmed),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur serveur");
        }
        writeCookie("he2b_firstName", trimmed.firstName);
        writeCookie("he2b_lastName", trimmed.lastName);
        writeCookie("he2b_email", trimmed.email);
        writeCookie("he2b_pseudo", trimmed.pseudo);
        setHasRegistration(true);
        setIsModalOpen(false);
        router.push(
          `${dailyPrefix}/${locale}/game?skin=${selectedSkinId}&difficulty=${getDifficultyValue(
            difficulty,
          )}`,
        );
      })
      .catch(() => {
        setFormError(
          "Impossible d'enregistrer tes infos. Réessaie dans un instant.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  useEffect(() => {
    const firstName = readCookie("he2b_firstName");
    const lastName = readCookie("he2b_lastName");
    const email = readCookie("he2b_email");
    const pseudo = readCookie("he2b_pseudo");
    if (firstName && lastName && email) {
      setHasRegistration(true);
    }
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
    if (pseudo) {
      setForm((prev) => ({ ...prev, pseudo }));
    }
  }, []);

  useEffect(() => {
    const email = readCookie("he2b_email");
    if (!email) return;
    fetch(`/api/score-limit?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.blocked) {
          setIsLimitReached(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="flex flex-col justify-center items-center h-screen gap-5">
      <div className="w-full absolute top-0 left-0">
        <He2bBar />
      </div>
      <Image
        className="float"
        src={selectedSkin.image}
        alt="Description"
        width={140}
        height={140}
      />
      <h1 className="text-he2b text-3xl font-extrabold text-center uppercase">
        {t("title")}
      </h1>
      <p className="text-gray-500 text-sm text-center -mt-5">HE2B Edition !</p>
      {isLimitReached ? (
        <div className="mx-6 max-w-md rounded-2xl bg-gray-50 px-5 py-4 text-center text-sm text-gray-600">
          <div className="text-he2b font-extrabold">
            Merci d&apos;avoir participé !
          </div>
          <p className="mt-2">
            Tu as atteint la limite de <span className="font-semibold">3</span>{" "}
            participations.
          </p>
        </div>
      ) : (
        <>
          <SkinSelector
            skins={Object.values(SKINS)}
            selectedSkin={selectedSkinId}
            onSelect={(skinId: string) => setSelectedSkinId(skinId as SkinKey)}
          />
          <p className="text-center">
            <span className="font-bold">{selectedSkin.name}</span>
            <br />
            <span className="text-gray-400 text-sm text-center">
              {selectedSkin.description}
            </span>
          </p>
          <DifficultySelector
            value={difficulty}
            onSelect={(value: string) => setDifficulty(value)}
            options={["🌱 Facile", "⚡ Normal", "🔥 Difficile"]}
          />
        </>
      )}
      <CTAButton
        label={isLimitReached ? "Voir les scores" : "Jouer"}
        onClick={handleStart}
      />
      <p className=" text-gray-400 text-sm text-center">
        <span>5 niveaux de 20 secondes !</span>
        <br />
        <span>
          Appuie au bon moment pour obtenir un multiplicateur (x2 ou x3) et
          évite les malus.
        </span>
        <br />
        <span className="block md:hidden">Tape sur la ligne !</span>
        <span className="hidden md:inline">Utilise D | F | J | K</span>
      </p>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-center">
              <h2 className="text-he2b text-2xl font-extrabold uppercase">
                Avant de jouer
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Entre ton nom, prénom, email et ton pseudo.
              </p>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Pseudo
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                    value={form.pseudo}
                    onInput={() => setFormError("")}
                    readOnly
                    type="text"
                    name="pseudo"
                    autoComplete="nickname"
                  />
                  <button
                    className="rounded-full border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-600 transition active:scale-95"
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        pseudo: generatePseudo(),
                      }))
                    }
                  >
                    Regénérer
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Prénom
                </label>
                <input
                  className="mt-1 w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                  onInput={() => setFormError("")}
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Nom
                </label>
                <input
                  className="mt-1 w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                  onInput={() => setFormError("")}
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Email
                </label>
                <input
                  className="mt-1 w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  onInput={() => setFormError("")}
                  type="email"
                  name="email"
                  autoComplete="email"
                />
              </div>
              {formError && (
                <div className="text-center text-xs font-semibold text-[#D91A5B]">
                  {formError}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  className="rounded-full bg-he2b px-5 py-2 text-xs font-bold text-white shadow transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi..." : "Commencer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
