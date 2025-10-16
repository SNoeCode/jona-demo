
"use client"

import { useEffect, useState } from "react";
import { Resume } from "@/types/user/index";

export const useResume = () => {
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("activeResume");
    if (stored) {
      setCurrentResume(JSON.parse(stored));
    }
  }, []);

  const setResume = (resume: Resume) => {
    setCurrentResume(resume);
    sessionStorage.setItem("activeResume", JSON.stringify(resume));
  };

  return { currentResume, setResume };
};