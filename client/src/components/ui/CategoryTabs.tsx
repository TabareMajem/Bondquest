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
    <div className="flex overflow-x-auto space-x-2 pb-3 -mx-1 px-1 no-scrollbar">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`flex-shrink-0 ${
            activeCategory === category.id
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-500 border border-gray-200"
          } px-5 py-2 rounded-full font-medium text-sm transition-colors`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
