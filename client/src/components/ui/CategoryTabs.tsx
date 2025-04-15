interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex overflow-x-auto space-x-2 no-scrollbar bg-purple-800 rounded-3xl p-1.5">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`flex-shrink-0 ${
            activeCategory === category.id
              ? "bg-purple-600 text-white"
              : "bg-transparent text-white text-opacity-80"
          } px-5 py-2.5 rounded-full font-medium text-sm transition-colors`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
