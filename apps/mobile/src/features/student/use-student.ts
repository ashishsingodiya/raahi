import { useQuery } from "@tanstack/react-query";

import { apiClient } from "~/utils/api";
import { authClient } from "~/utils/auth";

export function useStudent() {
  const session = authClient.useSession();
  const profile = useQuery({
    queryFn: () => apiClient.student.profile.query(),
    queryKey: ["student-profile", session.data?.user.id],
    enabled: Boolean(session.data?.user.id),
  });
  return { session, profile };
}
