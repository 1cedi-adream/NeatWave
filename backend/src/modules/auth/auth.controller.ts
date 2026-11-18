import type { Request, Response } from "express";
import * as authService from "./auth.service.js";

export const login = async (req: Request, res: Response) =>
  res.json({
    data: await authService.login(req.body.identifier, req.body.password),
  });

export const refresh = async (req: Request, res: Response) =>
  res.json({
    data: await authService.rotateRefreshToken(req.body.refreshToken),
  });

export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
};

export const forgot = async (req: Request, res: Response) => {
  const resetToken = await authService.requestReset(req.body.identifier);
  res.json({ data: { accepted: true, ...(resetToken ? { resetToken } : {}) } });
};

export const reset = async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(204).send();
};

export const acceptInvite = async (req: Request, res: Response) =>
  res.status(201).json({ data: await authService.acceptInvitation(req.body) });

export const me = async (req: Request, res: Response) =>
  res.json({ data: await authService.getCurrentUser(req.auth!.userId) });

export const updateMe = async (req: Request, res: Response) =>
  res.json({
    data: await authService.updateCurrentUser(req.auth!.userId, req.body),
  });
