import Image from 'next/image';
import React from 'react';

type SkinSelectorProps = {
	skins: Array<{ id: string; name: string; image: string }>;
	selectedSkin: string;
	onSelect: (skin: string) => void;
};

const SkinSelector: React.FC<SkinSelectorProps> = ({
	skins,
	selectedSkin,
	onSelect,
}) => (
	<div className="flex space-x-4 mt-4">
		{skins.map((skin) => (
			<button
				className={`size-14 rounded-lg border-[3px] cursor-pointer transition-all p-1.5 flex justify-center items-center ${
					skin.id === selectedSkin
						? 'border-[#D91A5B] bg-white scale-110 shadow-[0_4px_15px_rgba(217,26,91,0.3)]'
						: 'border-[#e0e0e0]'
				}`}
				key={skin.id}
				onClick={() => onSelect(skin.id)}>
				<Image src={skin.image} alt={skin.name} width={50} height={50} />
			</button>
		))}
	</div>
);

export default SkinSelector;
