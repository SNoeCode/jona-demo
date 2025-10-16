// import { supabase } from "@/lib/supabaseClient";
import { UserProfile, EnhancedUserProfile, isUserUsageSummary, UsagePayload} from "@/types/user/index";
// import { BillingService } from "./billing-service";
import {  } from "./usage-service";
import { getCurrentSubscription} from "./subscription-service";
import { InsertUserProfilePayload } from "@/types/user/index";
import { getUserUsage } from "@/app/services/server-user/server_user_usage";
import { supabase } from "@/lib/supabaseClient";
// function getServerClient() {
//   return createServerComponentClient<Database>({
//     cookies: () => cookies(),
//   });
// }
  export async function getUserProfile(userId: string): Promise<UserProfile | null> {
   
    // const supabase = getServerClient(); // ✅ server-safe

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("getUserProfile error:", error);
      return null;
    }
  }

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // const supabase = getServerClient(); // ✅ server-safe

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return null;
  }
}

 export async function uploadAvatar(userId: string, file: File): Promise<{ avatar_url: string } | null> {
    try {
          // const supabase = getServerClient(); // ✅ server-safe

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      await updateUserProfile(userId, { avatar_url: publicUrl });

      return { avatar_url: publicUrl };
    } catch (error) {
      console.error("uploadAvatar error:", error);
      return null;
    }
  }

 export async function createUserProfile(payload: InsertUserProfilePayload) {
    try {
      const profileData = {
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("📦 Creating user profile:", profileData);
    // const supabase = getServerClient(); // ✅ server-safe

      const { data, error } = await supabase
        .from("user_profiles")
        .insert([profileData])
        .select();

      if (error) {
        console.error("❌ Profile creation error:", error);
        throw new Error(`Profile creation failed: ${error.message}`);
      }

      console.log("✅ Profile created successfully:", data);
      return data;
    } catch (err) {
      console.error("❌ Profile creation failed:", err);
      throw err;
    }
  }


  //   static async getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
  //   try {
  //     const [profile, subscription, usage] = await Promise.allSettled([
  //       this.getUserProfile(userId),
  //      SubscriptionService.getCurrentSubscription(userId),
  //       UsageService.getUserUsage(userId)
  //     ]);

  //     const baseProfile = profile.status === 'fulfilled' ? profile.value : null;
      
  //     if (!baseProfile) {
  //       // Create default profile if none exists
  //       const defaultProfile: Partial<UserProfile> = {
  //         id: userId,
  //         created_at: new Date().toISOString(),
  //         updated_at: new Date().toISOString(),
  //       };
        
  //       const createdProfile = await this.updateUserProfile(userId, defaultProfile);
  //       if (!createdProfile) return null;
        
  //       return {
  //         ...createdProfile,
  //         current_subscription: subscription.status === 'fulfilled' ? subscription.value : null,
  //         usage: usage.status === 'fulfilled' ? usage.value : null,
  //         lastSeen: new Date().toISOString(),
  //       };
  //     }

  //     return {
  //       ...baseProfile,
  //       current_subscription: subscription.status === 'fulfilled' ? subscription.value : null,
  //       usage: usage.status === 'fulfilled' ? usage.value : null,
  //       lastSeen: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     console.error("getEnhancedUserProfile error:", error);
  //     return null;
  //   }
  // }
  export async function getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
  try {
    const [profile, subscription, usage] = await Promise.allSettled([
      getUserProfile(userId),
   getCurrentSubscription(userId),
      getUserUsage(userId),
    ]);

    const baseProfile = profile.status === "fulfilled" ? profile.value : null;

    if (!baseProfile) {
      const defaultProfile: Partial<UserProfile> = {
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdProfile = await updateUserProfile(userId, defaultProfile);
      if (!createdProfile) return null;

      return {
        ...createdProfile,
        current_subscription: subscription.status === "fulfilled" ? subscription.value : null,
        usage: usage.status === "fulfilled" ? usage.value : null,
        lastSeen: new Date().toISOString(),
      };
    }

    return {
      ...baseProfile,
      current_subscription: subscription.status === "fulfilled" ? subscription.value : null,
      usage: usage.status === "fulfilled" ? usage.value : null,
      lastSeen: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getEnhancedUserProfile error:", error);
    return null;
  }
}

