import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/errors.js";
import { z } from "zod";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError)
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: z.treeifyError(error),
      },
    });

  if (error instanceof AppError)
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });

  req.log?.error({ err: error }, "Unhandled request error");

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
