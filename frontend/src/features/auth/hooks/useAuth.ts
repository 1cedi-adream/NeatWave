import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearTokens,
  getRefreshToken,
  setAccessToken,
  storeRefreshToken,
} from "../api/tokenStorage";
import * as authApi from "../api/authApi";

export function useCurrentUser(enabled = true) {
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
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getRefreshToken();
      if (token) await authApi.logout(token);
    },
    onSettled: () => {
      clearTokens();
      queryClient.clear();
    },
  });
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
