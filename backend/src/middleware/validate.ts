import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) return next(parsed.error);

    const value = parsed.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    if (value.body) req.body = value.body;

    if (value.params) req.params = value.params as typeof req.params;

    if (value.query) req.query = value.query as typeof req.query;
    next();
  };
