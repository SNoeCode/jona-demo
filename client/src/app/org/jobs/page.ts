
// // app/org/jobs/page.tsx
// 'use client';
// import { useAuth } from '@/context/AuthUserContext';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import {isOrgUser, isOrgManager, isOrgOwner} from '@/utils/roles';
// export default function OrgUserJobsPage() {
//   const { user, loading, isOrgUser, isOrgManager, isOrgOwner, organization } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && (!user || (!isOrgUser && !isOrgManager && !isOrgOwner))) {
//       router.push('/login');
//     }
//   }, [user, loading, isOrgUser, isOrgManager, isOrgOwner, router]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-6 sm:px-0">
//           {/* Header */}
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
//                 <p className="text-gray-600 mt-2">
//                   {organization?.organization?.name || 'Organization'} Jobs
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-sm text-gray-500">Role</p>
//                 <p className="text-lg font-semibold text-teal-600 capitalize">
//                   {user.role?.replace('_', ' ')}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-blue-100 text-blue-600">
//                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600">Available Jobs</p>
//                   <p className="text-2xl font-bold text-gray-900">0</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
//                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600">Saved</p>
//                   <p className="text-2xl font-bold text-gray-900">0</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-green-100 text-green-600">
//                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600">Applied</p>
//                   <p className="text-2xl font-bold text-gray-900">0</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex items-center">
//                 <div className="p-3 rounded-full bg-purple-100 text-purple-600">
//                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-600">Interviews</p>
//                   <p className="text-2xl font-bold text-gray-900">0</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <div className="flex flex-wrap gap-4">
//               <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
//                 All Jobs
//               </button>
//               <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
//                 Saved
//               </button>
//               <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
//                 Applied
//               </button>
//               <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
//                 Interviews
//               </button>
//               <div className="ml-auto">
//                 <input
//                   type="text"
//                   placeholder="Search jobs..."
//                   className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Jobs List */}
//           <div className="bg-white rounded-lg shadow">
//             <div className="p-6 border-b border-gray-200">
//               <h3 className="text-lg font-bold text-gray-900">Available Positions</h3>
//             </div>
//             <div className="text-center py-16">
//               <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//               </svg>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs available yet</h3>
//               <p className="text-gray-500 mb-6">
//                 Check back later for new job postings from your organization
//               </p>
//               <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
//                 Browse All Jobs
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
