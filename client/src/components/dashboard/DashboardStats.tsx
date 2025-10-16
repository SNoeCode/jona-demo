"use client";

import React from "react";
import { Search, Mail, Save, Bell } from "lucide-react";
import { BaseDashboardStats } from "@/types/user";

interface DashboardStatsProps {
  stats: BaseDashboardStats;
  darkMode: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, darkMode }) => {
  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: Search,
      color: "blue",
      bgColor: darkMode ? "bg-blue-900/20" : "bg-blue-100",
      textColor: darkMode ? "text-blue-400" : "text-blue-600",
      iconBg: darkMode ? "bg-blue-800" : "bg-blue-100",
    },
    {
      title: "Applied",
      value: stats.appliedJobs,
      icon: Mail,
      color: "orange",
      bgColor: darkMode ? "bg-orange-900/20" : "bg-orange-100",
      textColor: darkMode ? "text-orange-400" : "text-orange-600",
      iconBg: darkMode ? "bg-orange-800" : "bg-orange-100",
    },
    {
      title: "Saved",
      value: stats.savedJobs,
      icon: Save,
      color: "blue",
      bgColor: darkMode ? "bg-blue-900/20" : "bg-blue-50",
      textColor: darkMode ? "text-blue-400" : "text-blue-700",
      iconBg: darkMode ? "bg-blue-800" : "bg-blue-200",
    },
    {
      title: "Interviews",
      value: stats.interviewJobs,
      icon: Bell,
      color: "orange",
      bgColor: darkMode ? "bg-orange-900/20" : "bg-orange-50",
      textColor: darkMode ? "text-orange-300" : "text-orange-700",
      iconBg: darkMode ? "bg-orange-800" : "bg-orange-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 animate-fade-in">
      {statCards.map((card) => (
        <div
          key={card.title}
          className={`group ${
            darkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          } rounded-lg shadow-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
        >
          <div className="flex items-center">
            <div
              className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110`}
            >
              <card.icon
                className={`w-6 h-6 transition-transform duration-200 ease-out group-hover:scale-110 ${card.textColor}`}
              />
            </div>
            <div className="ml-4">
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {card.title}
              </h3>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {Array.isArray(card.value) ? card.value.length : card.value}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 h-1 w-full rounded-full ${
              card.color === "blue"
                ? "bg-blue-200 dark:bg-blue-800"
                : card.color === "orange"
                ? "bg-orange-200 dark:bg-orange-800"
                : "bg-gray-200 dark:bg-gray-700"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;

