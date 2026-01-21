"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import SkinSelector from "../components/SkinSelector";
import DifficultySelector from "../components/DifficultySelector";
import CTAButton from "../components/CTAButton";

export default function Home() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const router = useRouter();
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
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [formError, setFormError] = useState("");
  const selectedSkin = SKINS[selectedSkinId];
  const getDifficultyValue = (label: string) => {
    if (label.toLowerCase().includes("difficile")) return "3";
    if (label.toLowerCase().includes("normal")) return "2";
    return "1";
  };
  const handleStart = () => {
    setFormError("");
    setIsModalOpen(true);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const trimmed = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    };
    if (!trimmed.firstName || !trimmed.lastName || !trimmed.email) {
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
        setIsModalOpen(false);
        router.push(
          `/${locale}/game?skin=${selectedSkinId}&difficulty=${getDifficultyValue(
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
  return (
    <main className="flex flex-col justify-center items-center h-screen gap-5">
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
      <CTAButton
        label="Jouer"
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
                Entre ton nom, prénom et email.
              </p>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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
    </main>
  );
}
