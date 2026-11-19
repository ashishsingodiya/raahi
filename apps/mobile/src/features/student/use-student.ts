import { useQuery } from "@tanstack/react-query";

import { apiClient } from "~/utils/api";
import { authClient } from "~/utils/auth";

export function useStudent() {
  const session = authClient.useSession();
  const profileKey = ["student-profile", session.data?.user.id] as const;
  const profile = useQuery({
    queryFn: () => apiClient.student.profile.query(),
    queryKey: profileKey,
    enabled: Boolean(session.data?.user.id),
  });
  return { session, profile, profileKey };
}
