'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import SkinSelector from '../components/SkinSelector';
import DifficultySelector from '../components/DifficultySelector';

export default function Home() {
	const t = useTranslations('HomePage');
	const SKINS = {
		diplome: {
			id: 'diplome',
			name: 'Diplômé',
			description: '"Prêt pour la remise des diplômes !"',
			speedMod: 1,
			spawnMod: 1,
			image: '/assets/diplomePoulpe.png',
		},
		travail: {
			id: 'travail',
			name: 'Studieux',
			description: '"Multi-tâches niveau expert."',
			speedMod: 0.9,
			spawnMod: 1.1,
			image: '/assets/travailPoulpe.png',
		},
		bibliothecaire: {
			id: 'bibliothecaire',
			name: 'Biblio',
			description: '"8 bras = 8 livres."',
			speedMod: 1,
			spawnMod: 1,
			catchWindow: 1.2,
			image: '/assets/bibliothecairePoulpe.png',
		},
		ecole: {
			id: 'ecole',
			name: 'A%tudiant',
			description: '"Direction les cours !"',
			speedMod: 1.1,
			spawnMod: 0.9,
			image: '/assets/ecolePoulpe.png',
		},
		surf: {
			id: 'surf',
			name: 'Surfeur',
			description: '"Surfer sur les deadlines."',
			speedMod: 1.15,
			spawnMod: 0.85,
			image: '/assets/surfPoulpe.png',
		},
	} as const;
	type SkinKey = keyof typeof SKINS;
	const [selectedSkinId, setSelectedSkinId] = useState<SkinKey>('diplome');
	const [difficulty, setDifficulty] = useState<string>('facile');
	const selectedSkin = SKINS[selectedSkinId];
	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<Image
				className="float"
				src={selectedSkin.image}
				alt="Description"
				width={140}
				height={140}
			/>
			<h1 className="text-he2b text-3xl font-extrabold text-center">
				{t('title')}
			</h1>
			<p>HE2B Edition !</p>
			<SkinSelector
				skins={Object.values(SKINS)}
				selectedSkin={selectedSkinId}
				onSelect={(skinId: string) => setSelectedSkinId(skinId as SkinKey)}
			/>
			<p>{selectedSkin.name}</p>
			<p>{selectedSkin.description}</p>
			<DifficultySelector
				value={difficulty}
				onSelect={(value: string) => setDifficulty(value)}
				options={['🌱 Facile', '⚡ Normal', '🔥 Difficile']}
			/>
		</main>
	);
}
