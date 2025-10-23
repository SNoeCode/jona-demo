import React from "react";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "orange" | "blue" | "green" | "gray";
};

const colorMap = {
  orange: {
    icon: "text-[#FF6B35]",
    value: "text-[#1B3A57] dark:text-white",
  },
  blue: {
    icon: "text-[#00A6A6]",
    value: "text-[#1B3A57] dark:text-white",
  },
  green: {
    icon: "text-green-500",
    value: "text-green-600 dark:text-green-400",
  },
  gray: {
    icon: "text-gray-500",
    value: "text-gray-700 dark:text-gray-300",
  },
};

export default function StatCard({
  icon,
  label,
  value,
  color = "gray",
}: StatCardProps) {
  const styles = colorMap[color];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`h-8 w-8 ${styles.icon}`}>{icon}</div>
        <span className={`text-2xl font-bold ${styles.value}`}>{value}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}