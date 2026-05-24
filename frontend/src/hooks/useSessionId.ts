import { useMemo } from "react";
import { getSessionId } from "../api/client";

export function useSessionId() {
  return useMemo(() => getSessionId(), []);
}
