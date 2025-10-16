
// "use client"
// import React, { useState, useEffect } from 'react';
// import { 
//   Crown, 
//   DollarSign, 
//   Users, 
//   Calendar, 
//   TrendingUp,
//   Search,
//   Filter,
//   Download,
//   Eye,
//   Edit,
//   Trash2,
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   CreditCard,
//   BarChart3,
//   Plus,
//   X
// } from 'lucide-react';
// // Types
// interface SubscriptionPlan {
//   id: string;
//   name: string;
//   description?: string;
//   price_monthly?: number;
//   price_yearly?: number;
//   features: string[];
//   max_jobs_per_month?: number;
//   max_resumes?: number;
//   max_applications_per_day?: number;
//   auto_scrape_enabled: boolean;
//   priority_support: boolean;
//   active: boolean;
//   created_at?: string;
//   updated_at?: string;
// }

// interface UserSubscription {
//   id: string;
//   user_id: string;
//   plan_id: string;
//   status: "active" | "canceled" | "expired" | "past_due" | "unpaid";
//   billing_cycle: "monthly" | "yearly";
//   current_period_start: string;
//   current_period_end: string;
//   stripe_subscription_id?: string;
//   stripe_customer_id?: string;
//   price_paid?: number;
//   created_at?: string;
//   updated_at?: string;
//   canceled_at?: string;
//   plan?: SubscriptionPlan;
// }

// interface UserUsage {
//   id: string;
//   user_id: string;
//   month_year: string;
//   jobs_scraped: number;
//   applications_sent: number;
//   resumes_uploaded: number;
//   created_at?: string;
//   updated_at?: string;
// }

// interface AdminSubscriptionData {
//   user_id: string;
//   user_name: string;
//   user_email: string;
//   subscription: UserSubscription & { plan: SubscriptionPlan };
//   total_paid: number;
//   last_payment_date?: string;
//   usage: UserUsage[];
//   payment_history: any[];
// }

// interface AdminSubscriptionStats {
//   totalRevenue: number;
//   monthlyRecurringRevenue: number;
//   activeSubscriptions: number;
//   churnRate: number;
//   averageRevenuePerUser: number;
//   planDistribution: {
//     free: number;
//     pro: number;
//     enterprise: number;
//   };
// }

// export default function AdminSubscriptionManagement() {
//   const [subscriptions, setSubscriptions] = useState<AdminSubscriptionData[]>([]);
//   const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
//   const [stats, setStats] = useState<AdminSubscriptionStats>({
//     totalRevenue: 0,
//     monthlyRecurringRevenue: 0,
//     activeSubscriptions: 0,
//     churnRate: 0,
//     averageRevenuePerUser: 0,
//     planDistribution: { free: 0, pro: 0, enterprise: 0 }
//   });
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [planFilter, setPlanFilter] = useState<string>("all");
//   const [loading, setLoading] = useState<boolean>(false);
//   const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscriptionData | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [subsRes, plansRes] = await Promise.all([
//           fetch("/api/admin/subscriptions"),
//           fetch("/api/admin/subscription-plans")
//         ]);
//         const subs: AdminSubscriptionData[] = await subsRes.json();
//         const plans: SubscriptionPlan[] = await plansRes.json();
//         setSubscriptions(subs);
//         setSubscriptionPlans(plans);
//       } catch (error) {
//         console.error("Error fetching subscription data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   useEffect(() => {
//     const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.subscription.price_paid || 0), 0);
//     const activeSubscriptions = subscriptions.filter(sub => sub.subscription.status === "active").length;
//     const monthlyRecurringRevenue = subscriptions
//       .filter(sub => sub.subscription.billing_cycle === "monthly" && sub.subscription.status === "active")
//       .reduce((sum, sub) => sum + (sub.subscription.price_paid || 0), 0);
//     const averageRevenuePerUser = subscriptions.length > 0 ? totalRevenue / subscriptions.length : 0;

//     const planDistribution = {
//       free: subscriptions.filter(sub => sub.subscription.plan?.name.toLowerCase() === "free").length,
//       pro: subscriptions.filter(sub => sub.subscription.plan?.name.toLowerCase() === "pro").length,
//       enterprise: subscriptions.filter(sub => sub.subscription.plan?.name.toLowerCase() === "enterprise").length
//     };

//     setStats({
//       totalRevenue,
//       monthlyRecurringRevenue,
//       activeSubscriptions,
//       averageRevenuePerUser,
//       churnRate: 0,
//       planDistribution
//     });
//   }, [subscriptions]);

//   const formatCurrency = (amount: number): string =>
//     new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

//   const getStatusColor = (status: string): string => {
//     switch (status) {
//       case "active": return "bg-green-100 text-green-800";
//       case "canceled": return "bg-gray-100 text-gray-800";
//       case "expired": return "bg-red-100 text-red-800";
//       case "past_due": return "bg-yellow-100 text-yellow-800";
//       case "unpaid": return "bg-red-100 text-red-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getStatusIcon = (status: string): JSX.Element => {
//     switch (status) {
//       case "active": return <CheckCircle className="w-4 h-4" />;
//       case "canceled": return <AlertCircle className="w-4 h-4" />;
//       case "expired": return <Clock className="w-4 h-4" />;
//       case "past_due": return <AlertCircle className="w-4 h-4" />;
//       case "unpaid": return <AlertCircle className="w-4 h-4" />;
//       default: return <Clock className="w-4 h-4" />;
//     }
//   };

//   const filteredSubscriptions = subscriptions.filter(sub => {
//     const matchesSearch = sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                           sub.user_email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = statusFilter === "all" || sub.subscription.status === statusFilter;
//     const matchesPlan = planFilter === "all" || sub.subscription.plan.name.toLowerCase() === planFilter;
//     return matchesSearch && matchesStatus && matchesPlan;
//   });



//   const handleCancelSubscription = async (subscriptionId: string): Promise<void> => {
//     if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
//     setLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       setSubscriptions(prev => 
//         prev.map(sub => 
//           sub.subscription.id === subscriptionId 
//             ? { ...sub, subscription: { ...sub.subscription, status: 'canceled' as const } }
//             : sub
//         )
//       );
//     } catch (error) {
//       console.error('Error canceling subscription:', error);
//       alert('Failed to cancel subscription. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefund = async (subscriptionId: string, amount: number): Promise<void> => {
//     if (!confirm(`Are you sure you want to refund ${formatCurrency(amount)}?`)) return;
    
//     setLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1500));
//       alert('Refund processed successfully');
//     } catch (error) {
//       console.error('Error processing refund:', error);
//       alert('Failed to process refund. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//               <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
//             </div>
//             <div className="p-3 bg-green-100 rounded-full">
//               <DollarSign className="w-6 h-6 text-green-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
//               <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRecurringRevenue)}</p>
//             </div>
//             <div className="p-3 bg-blue-100 rounded-full">
//               <TrendingUp className="w-6 h-6 text-blue-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
//               <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
//             </div>
//             <div className="p-3 bg-purple-100 rounded-full">
//               <Users className="w-6 h-6 text-purple-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Churn Rate</p>
//               <p className="text-2xl font-bold text-gray-900">{stats.churnRate}%</p>
//             </div>
//             <div className="p-3 bg-red-100 rounded-full">
//               <BarChart3 className="w-6 h-6 text-red-600" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Plan Distribution */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="text-center">
//             <div className="text-2xl font-bold text-gray-500">{stats.planDistribution.free}</div>
//             <div className="text-sm text-gray-600">Free Users</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-blue-600">{stats.planDistribution.pro}</div>
//             <div className="text-sm text-gray-600">Pro Users</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-purple-600">{stats.planDistribution.enterprise}</div>
//             <div className="text-sm text-gray-600">Enterprise Users</div>
//           </div>
//         </div>
//       </div>

//       {/* Search and Filters */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <div className="flex flex-col sm:flex-row gap-4 mb-6">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search users..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <div className="flex gap-2">
//             <select
//               className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="canceled">Canceled</option>
//               <option value="expired">Expired</option>
//               <option value="past_due">Past Due</option>
//               <option value="unpaid">Unpaid</option>
//             </select>
//             <select
//               className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               value={planFilter}
//               onChange={(e) => setPlanFilter(e.target.value)}
//             >
//               <option value="all">All Plans</option>
//               <option value="free">Free</option>
//               <option value="pro">Pro</option>
//               <option value="enterprise">Enterprise</option>
//             </select>
//             <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
//               <Download className="w-4 h-4" />
//               Export
//             </button>
//           </div>
//         </div>

//         {/* Subscriptions Table */}
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Plan</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Billing</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Next Payment</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Total Paid</th>
//                 <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredSubscriptions.map((sub) => (
//                 <tr key={sub.subscription.id} className="border-b border-gray-100 hover:bg-gray-50">
//                   <td className="py-4 px-4">
//                     <div>
//                       <div className="font-medium text-gray-900">{sub.user_name}</div>
//                       <div className="text-sm text-gray-600">{sub.user_email}</div>
//                     </div>
//                   </td>
//                   <td className="py-4 px-4">
//                     <div className="flex items-center gap-2">
//                       <Crown className="w-4 h-4 text-yellow-500" />
//                       <span className="font-medium">{sub.subscription.plan.name}</span>
//                     </div>
//                     <div className="text-sm text-gray-600">
//                       {formatCurrency(
//                         sub.subscription.billing_cycle === 'monthly' 
//                           ? sub.subscription.plan.price_monthly || 0
//                           : sub.subscription.plan.price_yearly || 0
//                       )}
//                       /{sub.subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
//                     </div>
//                   </td>
//                   <td className="py-4 px-4">
//                     <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.subscription.status)}`}>
//                       {getStatusIcon(sub.subscription.status)}
//                       {sub.subscription.status}
//                     </span>
//                   </td>
//                   <td className="py-4 px-4">
//                     <div className="text-sm">
//                       <div className="font-medium">{sub.subscription.billing_cycle}</div>
//                       <div className="text-gray-600">
//                         {formatCurrency(sub.subscription.price_paid || 0)}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="py-4 px-4">
//                     <div className="text-sm text-gray-900">
//                       {new Date(sub.subscription.current_period_end).toLocaleDateString()}
//                     </div>
//                   </td>
//                   <td className="py-4 px-4">
//                     <div className="font-medium text-gray-900">
//                       {formatCurrency(sub.total_paid)}
//                     </div>
//                   </td>
//                   <td className="py-4 px-4">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => {
//                           setSelectedSubscription(sub);
//                           setShowDetailsModal(true);
//                         }}
//                         className="p-1 text-gray-600 hover:text-blue-600"
//                         title="View Details"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </button>
//                       <button
//                         className="p-1 text-gray-600 hover:text-green-600"
//                         title="Edit Subscription"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </button>
//                       {sub.subscription.status === 'active' && (
//                         <button
//                           onClick={() => handleCancelSubscription(sub.subscription.id)}
//                           className="p-1 text-gray-600 hover:text-red-600"
//                           title="Cancel Subscription"
//                           disabled={loading}
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {filteredSubscriptions.length === 0 && (
//           <div className="text-center py-8 text-gray-500">
//             No subscriptions found matching your criteria.
//           </div>
//         )}
//       </div>

//       {/* Details Modal */}
//       {showDetailsModal && selectedSubscription && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
//             <div className="p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Subscription Details - {selectedSubscription.user_name}
//                 </h3>
//                 <button
//                   onClick={() => setShowDetailsModal(false)}
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
//                   <div className="space-y-2 text-sm">
//                     <div><strong>Name:</strong> {selectedSubscription.user_name}</div>
//                     <div><strong>Email:</strong> {selectedSubscription.user_email}</div>
//                     <div><strong>User ID:</strong> {selectedSubscription.user_id}</div>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
//                   <div className="space-y-2 text-sm">
//                     <div><strong>Plan:</strong> {selectedSubscription.subscription.plan.name}</div>
//                     <div><strong>Status:</strong> 
//                       <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSubscription.subscription.status)}`}>
//                         {selectedSubscription.subscription.status}
//                       </span>
//                     </div>
//                     <div><strong>Billing Cycle:</strong> {selectedSubscription.subscription.billing_cycle}</div>
//                     <div><strong>Current Period:</strong> 
//                       {' ' + new Date(selectedSubscription.subscription.current_period_start).toLocaleDateString()} - 
//                       {new Date(selectedSubscription.subscription.current_period_end).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
//                   <div className="space-y-2 text-sm">
//                     <div><strong>Current Price:</strong> {formatCurrency(selectedSubscription.subscription.price_paid || 0)}</div>
//                     <div><strong>Total Paid:</strong> {formatCurrency(selectedSubscription.total_paid)}</div>
//                     <div><strong>Last Payment:</strong> {selectedSubscription.last_payment_date ? new Date(selectedSubscription.last_payment_date).toLocaleDateString() : 'N/A'}</div>
//                     <div><strong>Stripe ID:</strong> {selectedSubscription.subscription.stripe_subscription_id || 'N/A'}</div>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-medium text-gray-900 mb-3">Usage This Month</h4>
//                   {selectedSubscription.usage.length > 0 && (
//                     <div className="space-y-2 text-sm">
//                       <div><strong>Jobs Scraped:</strong> {selectedSubscription.usage[0].jobs_scraped}</div>
//                       <div><strong>Applications Sent:</strong> {selectedSubscription.usage[0].applications_sent}</div>
//                       <div><strong>Resumes Uploaded:</strong> {selectedSubscription.usage[0].resumes_uploaded}</div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="mt-6 flex gap-3">
//                 <button
//                   onClick={() => handleRefund(selectedSubscription.subscription.id, selectedSubscription.subscription.price_paid || 0)}
//                   className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//                   disabled={loading}
//                 >
//                   {loading ? 'Processing...' : 'Issue Refund'}
//                 </button>
//                 <button
//                   onClick={() => handleCancelSubscription(selectedSubscription.subscription.id)}
//                   className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//                   disabled={loading}
//                 >
//                   {loading ? 'Processing...' : 'Cancel Subscription'}
//                 </button>
//                 <button
//                   onClick={() => setShowDetailsModal(false)}
//                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }