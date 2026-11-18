import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  storeRefreshToken,
} from "../api/tokenStorage";
import * as authApi from "../api/authApi";

export function useCurrentUser(
  enabled = Boolean(getAccessToken() || getRefreshToken()),
) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: authApi.getCurrentUser,
    enabled,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      identifier,
      password,
      remember,
    }: {
      identifier: string;
      password: string;
      remember: boolean;
    }) => {
      const session = await authApi.login(identifier, password);
      setAccessToken(session.accessToken);
      storeRefreshToken(session.refreshToken, remember);
      return authApi.getCurrentUser();
    },
    onSuccess: (currentUser) => {
      queryClient.setQueryData(queryKeys.currentUser, currentUser);
      window.dispatchEvent(new Event("neatwave:session-started"));
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const token = getRefreshToken();

      const logoutRequest = token
        ? authApi.logout(token).catch(() => undefined)
        : Promise.resolve();

      await Promise.all([wait(160), Promise.race([logoutRequest, wait(500)])]);
    },
    onSettled: () => {
      clearTokens();
      window.dispatchEvent(new Event("neatwave:session-expired"));
    },
  });
}

function wait(durationMilliseconds: number) {
  return new Promise<void>((resolve) =>
    window.setTimeout(resolve, durationMilliseconds),
  );
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.requestPasswordReset });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.acceptInvitation,
    onSuccess: async (session) => {
      setAccessToken(session.accessToken);
      storeRefreshToken(session.refreshToken, true);
      queryClient.setQueryData(
        queryKeys.currentUser,
        await authApi.getCurrentUser(),
      );
      window.dispatchEvent(new Event("neatwave:session-started"));
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateCurrentUser,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.currentUser, user),
  });
}
