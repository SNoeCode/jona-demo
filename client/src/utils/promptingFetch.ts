import { PromptResult } from "@/types/user/application";

export async function runPromptTest(resume: string, job: string): Promise<PromptResult> {
  const res = await fetch("http://localhost:8000/prompt-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resume, job_description: job }),
  });
  return await res.json();
}