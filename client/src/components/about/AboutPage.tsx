"use client";

export default function AboutPage() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
      className="min-h-screen py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-orange-600">
            About Bayan Labs: JobTracker
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Built for second chances, focused futures, and the power of staying organized.
          </p>
        </div>

        <div className="mt-16 rounded-lg shadow-lg p-8 bg-white dark:bg-blue-950 dark:text-gray-100 border border-orange-300">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-orange-500">Our Mission</h2>
            <p className="mb-6">
              At Bayan Labs, we believe every job seeker deserves clarity, confidence, and a fair shot.
              JobTracker was designed to support those rebuilding their lives—especially justice-involved
              individuals—by turning chaos into structure and effort into progress.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-orange-500">How It Works</h2>
            <p className="mb-6">
              JobTracker helps you track applications, follow up with employers, and stay on top of deadlines.
              It’s your personal dashboard for momentum—whether you’re applying from a halfway house, a shelter,
              or your first apartment after release.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-orange-500">Key Features</h2>
            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>Real-time job listings from trusted sources</li>
              <li>Personalized tracking of application status</li>
              <li>Resume uploads and version control</li>
              <li>Automated reminders for interviews and follow-ups</li>
              <li>Progress stats to help you stay motivated</li>
              <li>Secure, scalable infrastructure powered by Supabase</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 text-orange-500">Why It Matters</h2>
            <p className="mb-6">
              For many, the job search isn’t just about employment—it’s about dignity, stability, and a fresh start.
              JobTracker is built to honor that journey, offering tools that meet you where you are and grow with you.
            </p>

            <h2 className="text-2xl font-bold mb-4 text-orange-500">Get Started Today</h2>
            <p>
              You’ve got the grit. We’ve got the tools. Sign up now and take control of your job search—
              because your future deserves structure, support, and a system that believes in you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use-client";
// export default function AboutPage() {
//   return (
//     <div
//       style={{
//         backgroundColor: "var(--bg-color)",
//         color: "var(--text-color)",
//       }}
//       className="min-h-screen py-16"
//     >
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center">
//           <h1 className="text-4xl font-extrabold">
//             About Bayan Labs: JobTracker
//           </h1>
//           <p className="mt-4 text-xl">
//             Empowering job seekers to stay focused, organized, and confidently
//             pursue their careers
//           </p>
//         </div>

//         <div className="mt-16 rounded-lg shadow-lg p-8">
//           <div className="prose max-w-none">
//             <h2 className="text-2xl font-bold mb-4">
//               Our Mission
//             </h2>
//             <p className="mb-6">
//               At Bayan Labs, we built JobTracker to simplify the job search
//               process. From juggling application deadlines to following up with
//               recruiters, staying organized is tough — and that’s the problem
//               we’re solving.
//             </p>

//             <h2 className="text-2xl font-bold mb-4">
//               How It Works
//             </h2>
//             <p className="mb-6">
//               At Bayan Labs, we built JobTracker to simplify the job search
//               process. From juggling application deadlines to following up with
//               recruiters, staying organized is tough — and that’s the problem
//               we’re solving.
//             </p>

//             <h2 className="text-2xl font-bold mb-4">
//               Key Features
//             </h2>
//             <ul className="list-disc list-inside mb-6 space-y-2">
//               <li>Real-time job listings from trusted sources</li>
//               <li>Personalized tracking of application status</li>
//               <li>Document uploads and resume versioning</li>
//               <li>Automated interview reminders and task notes</li>
//               <li>Insights and stats to improve your search strategy</li>
//               <li>
//                 Secure and scalable data infrastructure powered by Supabase
//               </li>
//             </ul>

//             <h2 className="text-2xl font-bold mb-4">
//               Get Started Today
//             </h2>
//             <p className="">
//               Ready to take control of your job search? Sign up today and
//               experience the difference an organized approach can make in
//               landing your next opportunity.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
