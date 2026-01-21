import React from 'react';

type DifficultySelectorProps = {
	value: string;
	onSelect: (value: string) => void;
	options: string[];
};

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
	value,
	onSelect,
	options,
}) => (
	<div className="flex space-x-4 mt-4">
		{options.map((option) => (
			<button
				className={`py-2.5 px-4 rounded-full font-bold text-sm border-[3px] cursor-pointer transition-all p-1.5 flex justify-center items-center ${
					option === value
						? 'border-[#D91A5B] bg-white scale-110 shadow-[0_4px_15px_rgba(217,26,91,0.3)]'
						: 'border-[#e0e0e0]'
				}`}
				key={option}
				onClick={() => onSelect(option)}>
				{option}
			</button>
		))}
	</div>
);

export default DifficultySelector;
