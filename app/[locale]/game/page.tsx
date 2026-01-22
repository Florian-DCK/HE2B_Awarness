"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import He2bBar from "../../components/He2bBar";

const HE2B_COLORS = {
  yellow: "#F5C518",
  orange: "#F7941D",
  magenta: "#D91A5B",
  purple: "#9B4F9B",
  blue: "#0066B3",
  turquoise: "#00BFB3",
  green: "#8DC63F",
};

const GAME_CONFIG = {
  FOCUS_MAX: 100,
  FOCUS_DECAY_RATE: 2.5,
  BASE_SPAWN_INTERVAL: 1400,
  MIN_SPAWN_INTERVAL: 600,
  OBJECT_FALL_DURATION: 2600,
  DIFFICULTY_INCREASE_INTERVAL: 8000,
  COMMENT_COOLDOWN: 3500,
};

const LANES = [
  { id: 0, key: "D", color: HE2B_COLORS.orange },
  { id: 1, key: "F", color: HE2B_COLORS.magenta },
  { id: 2, key: "J", color: HE2B_COLORS.turquoise },
  { id: 3, key: "K", color: HE2B_COLORS.green },
];

const SKINS = {
  diplome: {
    id: "diplome",
    name: "Diplômé",
    description: '"Prêt pour la remise des diplômes !"',
    image: "/assets/diplomePoulpe.png",
    speedMod: 1,
    spawnMod: 1,
  },
  travail: {
    id: "travail",
    name: "Studieux",
    description: '"Multi-tâches niveau expert."',
    image: "/assets/travailPoulpe.png",
    speedMod: 0.9,
    spawnMod: 1.1,
  },
  bibliothecaire: {
    id: "bibliothecaire",
    name: "Biblio",
    description: '"8 bras = 8 livres."',
    image: "/assets/bibliothecairePoulpe.png",
    speedMod: 1,
    spawnMod: 1,
    catchWindow: 1.2,
  },
  ecole: {
    id: "ecole",
    name: "Étudiant",
    description: '"Direction les cours !"',
    image: "/assets/ecolePoulpe.png",
    speedMod: 1.1,
    spawnMod: 0.9,
  },
  surf: {
    id: "surf",
    name: "Surfeur",
    description: '"Surfer sur les deadlines."',
    image: "/assets/surfPoulpe.png",
    speedMod: 1.15,
    spawnMod: 0.85,
  },
} as const;

type SkinKey = keyof typeof SKINS;

type ObjectCategory =
  | "study"
  | "distraction"
  | "essential"
  | "social"
  | "random"
  | "malus";

type FallingObject = {
  id: number;
  type: string;
  emoji: string;
  label: string;
  category: ObjectCategory;
  points: number;
  lane: number;
  startTime: number;
  fallDuration: number;
  y: number;
  caught: boolean;
  missed: boolean;
  perfect: boolean;
};

type HitEffect = {
  id: number;
  lane: number;
  type: "perfect" | "good" | "miss" | "malus";
  multiplier: number;
  time: number;
};

type LeaderboardEntry = {
  score: number;
  maxCombo: number;
  skin: SkinKey;
  level: number;
  date: string;
};

type ScoreEntry = {
  firstName: string;
  lastName: string;
  score: number | null;
  maxCombo: number | null;
  level: number | null;
};

const STUDY_OBJECTS = [
  { type: "cours", emoji: "📚", label: "Cours", category: "study", points: 10 },
  {
    type: "projet",
    emoji: "📁",
    label: "Projet",
    category: "study",
    points: 10,
  },
  { type: "exam", emoji: "📝", label: "Exam", category: "study", points: 15 },
  {
    type: "deadline",
    emoji: "⏰",
    label: "Deadline",
    category: "study",
    points: 15,
  },
  { type: "memoire", emoji: "🎓", label: "TFE", category: "study", points: 20 },
  { type: "stage", emoji: "💼", label: "Stage", category: "study", points: 15 },
  {
    type: "sms",
    emoji: "📱",
    label: "SMS",
    category: "distraction",
    points: 5,
  },
  {
    type: "notif",
    emoji: "🔔",
    label: "Notif",
    category: "distraction",
    points: 5,
  },
  {
    type: "insta",
    emoji: "📸",
    label: "Insta",
    category: "distraction",
    points: 5,
  },
  {
    type: "cafe",
    emoji: "☕",
    label: "Café",
    category: "essential",
    points: 20,
  },
  {
    type: "motivation",
    emoji: "💪",
    label: "Motivation",
    category: "essential",
    points: 20,
  },
  {
    type: "sommeil",
    emoji: "😴",
    label: "Sommeil",
    category: "essential",
    points: 20,
  },
  {
    type: "soiree",
    emoji: "🎉",
    label: "Soirée",
    category: "social",
    points: 8,
  },
  {
    type: "pizza",
    emoji: "🍕",
    label: "Pizza",
    category: "random",
    points: 10,
  },
  { type: "bus", emoji: "🚌", label: "STIB", category: "random", points: 8 },
  { type: "bug", emoji: "🐛", label: "Bug", category: "malus", points: -15 },
  {
    type: "virus",
    emoji: "🦠",
    label: "Virus",
    category: "malus",
    points: -20,
  },
  { type: "spam", emoji: "📧", label: "Spam", category: "malus", points: -10 },
  {
    type: "procrastination",
    emoji: "🛋️",
    label: "Procrastination",
    category: "malus",
    points: -15,
  },
  {
    type: "retard",
    emoji: "⌛",
    label: "Retard",
    category: "malus",
    points: -20,
  },
];

const COMMENTS = {
  start: ["C'est parti !", "Let's go !", "Focus !", "Allez le poulpe !"],
  overload: ["Ça chauffe !", "Respire.", "Trop de tentacules !", "RIP"],
  perfect: ["PERFECT !", "Clean !", "Pro !", "8/8 tentacules !"],
  streak: ["Combo !", "On fire !", "Inarrêtable !", "Tentaculaire !"],
  drop: ["Oups.", "F", "Ça arrive.", "Glissé !"],
  essential: ["Café = Vie", "Boost !", "Énergie !"],
  malus: ["Aïe !", "Évite ça !", "Touché !", "Pas ça !"],
  dodge: ["Esquivé !", "Bien joué !", "Ouf !", "Nice dodge !"],
  bonus2x: ["x2 !", "Double !", "Précis !"],
  bonus3x: ["x3 !", "TRIPLE !", "ÉNORME !"],
};

const END_BADGES = [
  "Poulpe Débutant",
  "Tentacules du Chaos",
  "Multi-tâches Pro",
  "Survivant HE2B",
  "Poulpe Héro",
  "Légende Tentaculaire",
  "Diplômé avec Mention",
];

const LEVEL_DURATION = 20;
const TOTAL_LEVELS = 5;
const GAME_DURATION = LEVEL_DURATION * TOTAL_LEVELS;

const LEVEL_NAMES = [
  { name: "Semaine 1", subtitle: "La rentrée", emoji: "🎒" },
  { name: "Semaine 2", subtitle: "Les premiers cours", emoji: "📚" },
  { name: "Semaine 3", subtitle: "Les projets arrivent", emoji: "🧩" },
  { name: "Semaine 4", subtitle: "Le rush final", emoji: "⚡" },
  { name: "Semaine 5", subtitle: "Les examens !", emoji: "📝" },
];

const END_MESSAGES_POSITIVE = [
  "Bravo ! Tu as tenu jusqu'au bout !",
  "90 secondes de focus tentaculaire !",
  "Champion ! Tu gères le multi-tâches !",
  "Félicitations ! Tu es prêt pour la HE2B !",
  "Incroyable ! Le Poulpe est fier de toi !",
  "Tu déchires ! Continue comme ça !",
  "Mission accomplie ! Tu es un vrai pro !",
  "Waouw ! Quelle performance !",
  "GG ! Tu as tout donné !",
  "Superbe ! Les tentacules applaudissent !",
];

const LEVEL_ANECDOTES = [
  {
    title: "📌 Le sais-tu ?",
    text: 'Inscription ? Écris au département, pas "à l\'école". Ça répond plus vite !',
    tip: "Rue Royale, Louis Schmidt, Anderlecht. La HE2B, c'est apprendre à naviguer Bruxelles !",
  },
  {
    title: "💡 Conseil de Poulpy",
    text: "Le groupe WhatsApp : 90% memes, mais sans lui tu rates une deadline !",
    tip: 'L\'aide à la réussite : pas pour "les autres", pour optimiser ta survie !',
  },
  {
    title: "📚 Astuce HE2B",
    text: "La bibli : tu viens imprimer, tu restes 2h sauver ton travail.",
    tip: "Espaces d'étude : chez toi = tentations, sur campus = focus.",
  },
  {
    title: "🏁 Dernière ligne droite !",
    text: "Motivation constante ? Mythe. On bosse vraiment la semaine où il faut.",
    tip: '"J\'ai le temps" et tu finis ton travail à 3h du mat.',
  },
];

export default function GamePage() {
  const [screen, setScreen] = useState<"game" | "end">("game");
  const [selectedSkin, setSelectedSkin] = useState<SkinKey>("diplome");
  const [focus, setFocus] = useState(GAME_CONFIG.FOCUS_MAX);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comment, setComment] = useState("");
  const [commentType, setCommentType] = useState<keyof typeof COMMENTS | "">(
    "",
  );
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [activeLanes, setActiveLanes] = useState<number[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [levelTimeRemaining, setLevelTimeRemaining] = useState(LEVEL_DURATION);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [endMessage, setEndMessage] = useState("");
  const [gameEndReason, setGameEndReason] = useState<"time" | "focus" | "">("");
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled] = useState(true);

  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const goToHome = useCallback(() => {
    router.push(`/${locale}`);
  }, [router, locale]);

  const readCookie = (name: string) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length < 2) return "";
    return parts.pop()?.split(";").shift() ?? "";
  };

  useEffect(() => {
    const skinParam = searchParams.get("skin");
    const difficultyParam = searchParams.get("difficulty");

    if (skinParam && skinParam in SKINS) {
      setSelectedSkin(skinParam as SkinKey);
    }

    if (difficultyParam) {
      const parsedDifficulty = Number.parseInt(difficultyParam, 10);
      if (!Number.isNaN(parsedDifficulty)) {
        const clamped = Math.min(Math.max(parsedDifficulty, 1), 3);
        setDifficulty(clamped);
      }
    }
  }, [searchParams]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const comboRef = useRef(0);
  const laneCooldownRef = useRef([0, 0, 0, 0]);
  const LANE_COOLDOWN_MS = 150;
  const scoreSubmittedRef = useRef(false);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  const randomFrom = <T,>(arr: T[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    (type: "catch" | "perfect" | "malus" | "miss") => {
      if (!soundEnabled) return;
      try {
        const ctx = initAudio();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type) {
          case "catch":
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              900,
              ctx.currentTime + 0.1,
            );
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + 0.15,
            );
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
            break;
          case "perfect":
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              1200,
              ctx.currentTime + 0.15,
            );
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + 0.2,
            );
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            break;
          case "malus":
            oscillator.type = "sawtooth";
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              100,
              ctx.currentTime + 0.2,
            );
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + 0.25,
            );
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.25);
            break;
          case "miss":
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              100,
              ctx.currentTime + 0.15,
            );
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + 0.15,
            );
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
            break;
        }
      } catch {
        // Audio non supportAc
      }
    },
    [soundEnabled, initAudio],
  );

  const showComment = useCallback(
    (type: keyof typeof COMMENTS) => {
      const now = Date.now();
      if (now - lastCommentTime < GAME_CONFIG.COMMENT_COOLDOWN) return;
      setComment(randomFrom(COMMENTS[type]));
      setCommentType(type);
      setLastCommentTime(now);
      setTimeout(() => {
        setComment("");
        setCommentType("");
      }, 2000);
    },
    [lastCommentTime],
  );

  const getFocusLevel = () => {
    if (focus > 66) return { label: "OK", color: HE2B_COLORS.green };
    if (focus > 33) return { label: "Moyen", color: HE2B_COLORS.orange };
    return { label: "DANGER", color: HE2B_COLORS.magenta };
  };

  const spawnObject = useCallback(() => {
    const skin = SKINS[selectedSkin];
    const objectType = randomFrom(
      STUDY_OBJECTS,
    ) as (typeof STUDY_OBJECTS)[number];
    const lane = Math.floor(Math.random() * 4);

    let fallDuration =
      GAME_CONFIG.OBJECT_FALL_DURATION / (1 + (difficulty - 1) * 0.1);
    fallDuration *= skin.speedMod;

    setObjects((prev) => [
      ...prev,
      {
        id: objectIdRef.current++,
        ...objectType,
        category: objectType.category as ObjectCategory,
        lane,
        startTime: Date.now(),
        fallDuration,
        y: 0,
        caught: false,
        missed: false,
        perfect: false,
      },
    ]);
  }, [selectedSkin, difficulty]);

  const addHitEffect = (
    lane: number,
    type: HitEffect["type"],
    multiplier = 1,
  ) => {
    const id = effectIdRef.current++;
    setHitEffects((prev) => [
      ...prev,
      { id, lane, type, multiplier, time: Date.now() },
    ]);
    setTimeout(
      () => setHitEffects((prev) => prev.filter((effect) => effect.id !== id)),
      600,
    );

    if (type === "malus") playSound("malus");
    else if (multiplier >= 2) playSound("perfect");
    else if (type === "good") playSound("catch");
    else if (type === "miss") playSound("miss");
  };

  const isInCatchZone = (y: number) => y >= 75 && y <= 100;

  const getMultiplierZone = (y: number) => {
    if (y >= 88 && y <= 92) return 3;
    if (y >= 84 && y <= 96) return 2;
    return 1;
  };

  const handleLaneTap = useCallback(
    (laneId: number) => {
      if (screen !== "game" || isPaused || showLevelTransition) return;

      const now = Date.now();
      if (now - laneCooldownRef.current[laneId] < LANE_COOLDOWN_MS) return;
      laneCooldownRef.current[laneId] = now;

      setActiveLanes((prev) => [...prev, laneId]);
      setTimeout(
        () => setActiveLanes((prev) => prev.filter((lane) => lane !== laneId)),
        150,
      );

      setObjects((prev) => {
        let caughtAny = false;
        let multiplier = 1;
        let caughtObj: FallingObject | null = null;

        const updated = prev.map((obj) => {
          if (obj.caught || obj.missed || caughtAny) return obj;
          if (obj.lane !== laneId) return obj;

          if (isInCatchZone(obj.y)) {
            caughtAny = true;
            multiplier = getMultiplierZone(obj.y);
            caughtObj = obj;
            return { ...obj, caught: true, perfect: multiplier >= 2 };
          }
          return obj;
        });

        if (
          caughtAny &&
          caughtObj !== null &&
          typeof (caughtObj as FallingObject).category !== "undefined"
        ) {
          const isMalus = (caughtObj as FallingObject).category === "malus";
          const basePoints = (caughtObj as FallingObject).points;
          const currentCombo = comboRef.current;

          if (isMalus) {
            setScore((s) => Math.max(0, s + basePoints));
            setCombo(0);
            setFocus((f) => Math.max(0, f - 15));
            addHitEffect(laneId, "malus");
            showComment("malus");
          } else {
            const comboMultiplier = 1 + Math.floor(currentCombo / 5) * 0.2;
            const points = Math.floor(
              basePoints * comboMultiplier * multiplier,
            );

            setScore((s) => s + points);
            setCombo((c) => {
              const newCombo = c + 1;
              setMaxCombo((m) => Math.max(m, newCombo));
              if (newCombo > 0 && newCombo % 5 === 0) showComment("streak");
              return newCombo;
            });

            if ((caughtObj as FallingObject).category === "essential") {
              setFocus((f) => Math.min(GAME_CONFIG.FOCUS_MAX, f + 12));
              showComment("essential");
            } else {
              setFocus((f) => Math.min(GAME_CONFIG.FOCUS_MAX, f + 3));
            }

            if (multiplier === 3) {
              addHitEffect(laneId, "perfect", 3);
              showComment("bonus3x");
            } else if (multiplier === 2) {
              addHitEffect(laneId, "perfect", 2);
              showComment("bonus2x");
            } else {
              addHitEffect(laneId, "good", 1);
            }
          }
        }

        return updated;
      });
    },
    [screen, isPaused, showLevelTransition, showComment],
  );

  useEffect(() => {
    if (screen !== "game") return;

    const keyMap: Record<string, number> = {
      d: 0,
      f: 1,
      j: 2,
      k: 3,
      D: 0,
      F: 1,
      J: 2,
      K: 3,
    };
    const pressedKeys = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (pressedKeys.has(event.key)) return;
      const lane = keyMap[event.key];
      if (lane !== undefined) {
        event.preventDefault();
        pressedKeys.add(event.key);
        handleLaneTap(lane);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [screen, handleLaneTap]);

  useEffect(() => {
    if (screen !== "game" || isPaused || showLevelTransition) return;

    const gameLoop = setInterval(() => {
      setTimeElapsed((t) => t + 100);

      setObjects((prev) => {
        let missedCount = 0;
        let missedEssential = false;
        let avoidedMalus = 0;

        const updated = prev.map((obj) => {
          if (obj.caught) return obj;

          const elapsed = Date.now() - obj.startTime;
          const progress = (elapsed / obj.fallDuration) * 100;

          if (progress >= 100 && !obj.missed) {
            if (obj.category === "malus") {
              avoidedMalus += 1;
              return { ...obj, missed: true, y: 100 };
            }

            missedCount += 1;
            if (obj.category === "essential") missedEssential = true;
            addHitEffect(obj.lane, "miss");
            return { ...obj, missed: true, y: 100 };
          }

          return { ...obj, y: Math.min(progress, 100) };
        });

        if (missedCount > 0) {
          const penalty = missedEssential ? 20 : 12;
          setFocus((f) => Math.max(0, f - penalty * missedCount));
          setCombo(0);
          showComment("drop");
        }

        if (avoidedMalus > 0) {
          setFocus((f) =>
            Math.min(GAME_CONFIG.FOCUS_MAX, f + 3 * avoidedMalus),
          );
          showComment("dodge");
        }

        return updated.filter((obj) => {
          if (obj.caught || obj.missed)
            return Date.now() - obj.startTime < obj.fallDuration + 500;
          return true;
        });
      });

      setFocus((f) => Math.max(0, f - GAME_CONFIG.FOCUS_DECAY_RATE * 0.1));
      setDifficulty(
        1 +
          Math.floor(timeElapsed / GAME_CONFIG.DIFFICULTY_INCREASE_INTERVAL) *
            0.5,
      );
    }, 100);

    gameLoopRef.current = gameLoop;
    return () => clearInterval(gameLoop);
  }, [screen, showComment, timeElapsed, isPaused, showLevelTransition]);

  useEffect(() => {
    if (screen !== "game" || isPaused || showLevelTransition) return;
    const skin = SKINS[selectedSkin];
    const baseInterval = GAME_CONFIG.BASE_SPAWN_INTERVAL * skin.spawnMod;
    const interval = Math.max(
      GAME_CONFIG.MIN_SPAWN_INTERVAL,
      baseInterval / (1 + (difficulty - 1) * 0.35),
    );
    spawnTimerRef.current = setInterval(spawnObject, interval);
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [
    screen,
    selectedSkin,
    difficulty,
    spawnObject,
    isPaused,
    showLevelTransition,
  ]);

  useEffect(() => {
    if (screen !== "game" || isPaused || showLevelTransition) return;

    const timeInCurrentLevel =
      timeElapsed - (currentLevel - 1) * LEVEL_DURATION * 1000;
    const remaining = LEVEL_DURATION - Math.floor(timeInCurrentLevel / 1000);
    setLevelTimeRemaining(Math.max(0, remaining));

    const levelShouldBe = Math.floor(timeElapsed / (LEVEL_DURATION * 1000)) + 1;
    if (levelShouldBe > currentLevel && currentLevel < TOTAL_LEVELS) {
      setShowLevelTransition(true);
      setObjects([]);
    }
  }, [screen, timeElapsed, currentLevel, isPaused, showLevelTransition]);

  const continueToNextLevel = useCallback(() => {
    setCurrentLevel((prev) => prev + 1);
    setShowLevelTransition(false);
    setDifficulty((prev) => prev + 0.5);
    playSound("perfect");
  }, [playSound]);

  useEffect(() => {
    const timeUp = timeElapsed >= GAME_DURATION * 1000;
    const focusOut = focus <= 0;

    if ((timeUp || focusOut) && screen === "game" && !showLevelTransition) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      setGameEndReason(timeUp ? "time" : "focus");
      setEndMessage(randomFrom(END_MESSAGES_POSITIVE));

      const newEntry: LeaderboardEntry = {
        score,
        maxCombo,
        skin: selectedSkin,
        level: currentLevel,
        date: new Date().toLocaleTimeString("fr-BE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setLeaderboard((prev) =>
        [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 5),
      );
      if (!scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        const firstName = readCookie("he2b_firstName");
        const lastName = readCookie("he2b_lastName");
        if (firstName && lastName) {
          fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              lastName,
              score,
              maxCombo,
              level: currentLevel,
            }),
          }).catch(() => {});
        }
      }
      setScreen("end");
    }
  }, [
    focus,
    screen,
    timeElapsed,
    score,
    maxCombo,
    selectedSkin,
    currentLevel,
    showLevelTransition,
  ]);

  useEffect(() => {
    if (screen !== "end") return;
    let isActive = true;

    fetch("/api/scores")
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        const list = Array.isArray(data?.scores) ? data.scores : [];
        const topThree = list
          .filter((entry: ScoreEntry) => Number.isFinite(entry?.score))
          .sort(
            (a: ScoreEntry, b: ScoreEntry) =>
              (b.score ?? 0) - (a.score ?? 0),
          )
          .slice(0, 3);
        setTopScores(topThree);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [screen]);

  const startGame = () => {
    setFocus(GAME_CONFIG.FOCUS_MAX);
    setObjects([]);
    setTimeElapsed(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setDifficulty(1);
    setComment("");
    setHitEffects([]);
    setIsPaused(false);
    setCurrentLevel(1);
    setShowLevelTransition(false);
    setLevelTimeRemaining(LEVEL_DURATION);
    objectIdRef.current = 0;
    scoreSubmittedRef.current = false;
    setScreen("game");
    setTimeout(() => showComment("start"), 500);
    initAudio();
  };

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && screen === "game") {
        togglePause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, togglePause]);

  const displayScores =
    topScores.length > 0
      ? topScores.map((entry) => ({
          score: entry.score ?? 0,
          maxCombo: entry.maxCombo ?? 0,
          level: entry.level ?? 0,
        }))
      : leaderboard.slice(0, 3).map((entry) => ({
          score: entry.score,
          maxCombo: entry.maxCombo,
          level: entry.level,
        }));

  return (
    <main className="h-[100dvh] bg-[#0a0a14]">
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[linear-gradient(180deg,#1a1a2e_0%,#0f0f1a_100%)]">
        {screen === "game" && (
          <div className="relative flex h-full flex-col">
            <He2bBar />
            <div className="flex items-center gap-3 bg-black/30 px-3 py-2 text-white">
              <div className="h-9 w-9 rounded-full bg-white p-1">
                <img
                  src={SKINS[selectedSkin].image}
                  alt="Poulpe"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${focus}%`,
                      background: `linear-gradient(90deg, ${getFocusLevel().color}, ${getFocusLevel().color}dd)`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full bg-white/10 px-2 py-1">
                  Niv.<span className="font-bold">{currentLevel}</span>
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1">
                  <span className="text-he2b font-bold">{score}</span> pts
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1">
                  x{combo}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1">
                  {levelTimeRemaining}s
                </span>
              </div>
              <button
                className="ml-1 rounded-full bg-white/10 px-2 py-1 text-xs font-bold transition active:scale-95"
                onClick={togglePause}
                title="Pause (Echap)"
              >
                ||
              </button>
            </div>

            <div className="relative flex flex-1 overflow-hidden">
              <div className="pointer-events-none absolute left-0 right-0 top-[75%] z-10 h-[3px] bg-[linear-gradient(90deg,#F5C518,#F7941D,#D91A5B,#9B4F9B,#0066B3,#00BFB3,#8DC63F)]" />

              {LANES.map((lane) => (
                <div
                  key={lane.id}
                  className="relative flex-1 border-r border-white/10 last:border-r-0"
                >
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{ background: lane.color }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.1)_100%)]" />
                  <div className="pointer-events-none absolute left-0 right-0 top-[84%] h-[12%] bg-orange-400/20" />
                  <div className="pointer-events-none absolute left-0 right-0 top-[88%] h-[4%] bg-yellow-400/30" />
                  <div className="pointer-events-none absolute left-0 right-0 top-[90%] h-[3px] bg-[linear-gradient(90deg,rgba(255,215,0,0.8),rgba(255,100,0,0.8))] shadow-[0_0_10px_rgba(255,215,0,0.5)]" />

                  {objects
                    .filter((obj) => obj.lane === lane.id)
                    .map((obj) => (
                      <div
                        key={obj.id}
                        className="absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center transition-opacity duration-200"
                        style={{
                          top: `${obj.y}%`,
                          opacity: obj.caught ? 0.4 : 1,
                        }}
                      >
                        <span
                          className={`text-2xl sm:text-3xl ${
                            obj.category === "malus"
                              ? "animate-[malus-pulse_0.5s_ease-in-out_infinite]"
                              : ""
                          }`}
                        >
                          {obj.emoji}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            obj.category === "malus"
                              ? "text-[#D91A5B]"
                              : "text-white/80"
                          }`}
                        >
                          {obj.label}
                        </span>
                      </div>
                    ))}

                  {hitEffects
                    .filter((effect) => effect.lane === lane.id)
                    .map((effect) => {
                      const effectColor =
                        effect.type === "malus"
                          ? "text-[#D91A5B]"
                          : effect.type === "miss"
                            ? "text-[#D91A5B]"
                            : effect.type === "good"
                              ? "text-[#8DC63F]"
                              : "text-yellow-300";
                      return (
                        <div
                          key={effect.id}
                          className={`absolute left-1/2 top-[78%] z-30 -translate-x-1/2 text-sm font-extrabold ${effectColor} animate-[hit-pop_0.4s_ease-out]`}
                        >
                          {effect.type === "malus"
                            ? "NOPE"
                            : effect.type === "perfect" &&
                                effect.multiplier === 3
                              ? "x3"
                              : effect.type === "perfect" &&
                                  effect.multiplier === 2
                                ? "x2"
                                : effect.type === "perfect"
                                  ? "OK"
                                  : effect.type === "good"
                                    ? "OK"
                                    : "MISS"}
                        </div>
                      );
                    })}
                </div>
              ))}

              {comment && (
                <div className="absolute left-1/2 top-[8%] z-30 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white shadow-lg animate-[comment-pop_0.2s_ease-out]">
                  <span
                    className={
                      commentType === "malus" ? "text-[#D91A5B]" : "text-he2b"
                    }
                  >
                    {comment}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 bg-black/20 p-2">
              {LANES.map((lane) => (
                <button
                  key={lane.id}
                  className={`flex h-16 flex-1 flex-col items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-95 ${
                    activeLanes.includes(lane.id) ? "scale-95" : ""
                  }`}
                  style={{ background: lane.color }}
                  onTouchStart={(event) => {
                    event.preventDefault();
                    handleLaneTap(lane.id);
                  }}
                  onMouseDown={() => handleLaneTap(lane.id)}
                >
                  TAP
                  <span className="text-lg">{lane.key}</span>
                </button>
              ))}
            </div>

            {showLevelTransition && currentLevel < TOTAL_LEVELS && (
              <div className="absolute inset-0 z-40 flex flex-col bg-white">
                <He2bBar />
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="rounded-full bg-[linear-gradient(135deg,#D91A5B,#9B4F9B)] px-4 py-2 text-white">
                    Niveau {currentLevel} terminé !
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    Score : <span className="text-he2b font-bold">{score}</span>{" "}
                    pts
                  </div>

                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-gray-50 p-4 shadow-sm">
                    <img
                      src="/assets/diplomePoulpe.png"
                      alt="Poulpy"
                      className="h-16 w-16"
                    />
                    <div className="text-sm font-bold text-gray-700">
                      {LEVEL_ANECDOTES[currentLevel - 1]?.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {LEVEL_ANECDOTES[currentLevel - 1]?.text}
                    </div>
                    <div className="text-xs font-semibold text-[#00BFB3]">
                      {LEVEL_ANECDOTES[currentLevel - 1]?.tip}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow">
                    Prochain : {LEVEL_NAMES[currentLevel]?.name} -{" "}
                    {LEVEL_NAMES[currentLevel]?.subtitle}
                  </div>

                  <button
                    className="rounded-full bg-[linear-gradient(135deg,#D91A5B,#9B4F9B)] px-6 py-3 text-sm font-bold text-white shadow transition active:scale-95"
                    onClick={continueToNextLevel}
                  >
                    Continuer
                  </button>
                </div>
                <div className="border-t border-gray-100 px-2 py-2 text-center text-[11px] text-gray-400">
                  HE2B - Haute École Bruxelles-Brabant
                </div>
              </div>
            )}

            {isPaused && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 text-white">
                <div className="text-xl font-extrabold">PAUSE</div>
                <div className="mt-4 flex gap-3">
                  <button
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-gray-800 transition active:scale-95"
                    onClick={togglePause}
                  >
                    Reprendre
                  </button>
                  <button
                    className="rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-white transition active:scale-95"
                    onClick={() => {
                      setIsPaused(false);
                      goToHome();
                    }}
                  >
                    Quitter
                  </button>
                </div>
                <p className="mt-3 text-xs text-white/60">
                  Appuie sur Echap pour reprendre
                </p>
              </div>
            )}
          </div>
        )}

        {screen === "end" && (
          <div className="flex h-full flex-col bg-white">
            <He2bBar />
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <img
                src="/assets/coeurPoulpe.png"
                alt="Poulpe coeur"
                className="h-24 w-24"
              />

              <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#00BFB3]">
                {gameEndReason === "time" ? "Temps écoulé !" : "Focus épuisé !"}
              </div>

              <div className="text-sm italic text-gray-500">{endMessage}</div>

              <div>
                <div className="text-5xl font-black text-he2b">{score}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-gray-800">
                    Niv.{currentLevel}
                  </div>
                  <div className="text-[11px] text-gray-400">Atteint</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-extrabold text-gray-800">
                    {maxCombo}x
                  </div>
                  <div className="text-[11px] text-gray-400">Max Combo</div>
                </div>
              </div>

              <div className="rounded-full bg-[linear-gradient(135deg,#fff3cd,#ffeeba)] px-6 py-2 text-sm font-bold text-[#856404]">
                {
                  END_BADGES[
                    Math.min(Math.floor(score / 200), END_BADGES.length - 1)
                  ]
                }
              </div>

              {displayScores.length > 0 && (
                <div className="w-full max-w-[320px] rounded-2xl bg-gray-50 p-4">
                  <div className="mb-2 text-center text-xs font-extrabold text-gray-700">
                    Meilleurs scores
                  </div>
                  <div className="flex flex-col gap-2">
                    {displayScores.map((entry, index) => {
                      const isCurrent =
                        entry.score === score && entry.maxCombo === maxCombo;
                      return (
                        <div
                          key={`${entry.score}-${index}`}
                          className={`flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 ${
                            isCurrent
                              ? "border border-[#D91A5B]/50 bg-[linear-gradient(135deg,rgba(217,26,91,0.08),rgba(155,79,155,0.08))] animate-[pulse-current_1s_ease-in-out_infinite]"
                              : ""
                          }`}
                        >
                          <span className="w-6 text-sm">
                            {index === 0
                              ? "🏆"
                              : index === 1
                                ? "🥈"
                                : index === 2
                                  ? "🥉"
                                  : `${index + 1}.`}
                          </span>
                          <span className="flex-1 font-extrabold text-he2b">
                            {entry.score} pts
                          </span>
                          <span className="text-[10px] font-semibold text-[#9B4F9B]">
                            Niv.{entry.level}
                          </span>
                          <span className="font-semibold text-[#00BFB3]">
                            x{entry.maxCombo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 transition active:scale-95"
                  onClick={goToHome}
                >
                  Menu
                </button>
                <button
                  className="rounded-full bg-[linear-gradient(135deg,#D91A5B,#9B4F9B)] px-6 py-3 text-sm font-bold text-white shadow transition active:scale-95"
                  onClick={startGame}
                >
                  Rejouer
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 px-2 py-2 text-center text-[11px] text-gray-400">
              HE2B - Haute École Bruxelles-Brabant
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes malus-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @keyframes hit-pop {
          0% {
            transform: translate(-50%, 0) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -6px) scale(1);
            opacity: 1;
          }
        }

        @keyframes comment-pop {
          0% {
            transform: translateX(-50%) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-current {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </main>
  );
}
