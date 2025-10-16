
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthUserContext";
import type { UserJobStatus } from "@/types/user/index";
import { supabase } from "@/lib/supabaseClient";
import type { JobStatusPayload } from "@/types/user/index";

export const useUserJobStatus = () => {
  const { authUser } = useAuth();
  const [statusMap, setStatusMap] = useState<Map<string, UserJobStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!authUser?.id ) {
        setLoading(false);
        return;
      }

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          console.error("No valid session found");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_job_status")
          .select("*")
          .eq("user_id", authUser.id);

        if (error) {
          console.error("Error fetching job status:", error.message);
          return;
        }

        const map = new Map<string, UserJobStatus>();
        data?.forEach((status) => {
          map.set(status.job_id, status);
        });
        setStatusMap(map);
      } catch (error) {
        console.error("Failed to fetch job statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [authUser?.id]);

  return { statusMap, loading };
};

export const useJobStatusWriter = () => {
  const { authUser } = useAuth();

  const upsertStatus = async (payload: JobStatusPayload) => {
    if (!authUser?.id) {
      console.error("No authenticated user or access token");
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("No valid session found");
        return;
      }

      // Prepare the payload without created_at if it doesn't exist in schema
      const cleanPayload = {
        user_id: authUser.id,
        job_id: payload.job_id,
        status: payload.status,
        applied: payload.applied,
        saved: payload.saved,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key as keyof typeof cleanPayload] === undefined) {
          delete cleanPayload[key as keyof typeof cleanPayload];
        }
      });

      const { error } = await supabase
        .from("user_job_status")
        .upsert([cleanPayload], { 
          onConflict: "user_id,job_id",
          ignoreDuplicates: false 
        });

      if (error) {
        console.error("Error writing job status:", error.message);
        throw error;
      }

      console.log("Job status updated successfully");
    } catch (error) {
      console.error("Failed to update job status:", error);
      throw error;
    }
  };

  return { upsertStatus };
};