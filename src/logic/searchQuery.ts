import { z } from "zod";

export const SearchQueryRequestSchema = z.object({
  q: z.string().trim().max(200, "El query de búsqueda es demasiado largo").optional(),
  class: z.string().trim().max(200, "El filtro de clase es demasiado largo").optional(),
  status: z.enum(["annotated", "pending"]).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().min(1, "La página debe ser mayor o igual a 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "El límite debe ser mayor o igual a 1")
    .max(50, "El límite no puede exceder 50")
    .default(10),
});

export const SearchQuerySchema = z.object({
  terms: z.array(z.string().min(1)),
  status: z.enum(["annotated", "pending"]).optional(),
  from: z.date().optional(),
  toExclusive: z.date().optional(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().nonnegative(),
});

export const SearchResultItemSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().int().nonnegative(),
  url: z.string().min(1),
  createdAt: z.date(),
});

export const SearchResponseSchema = z.object({
  items: z.array(SearchResultItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
});

export type ParsedSearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

const andBoundaryPattern = /\bAND\b/i;
const malformedAndPattern = /(^AND\b|\bAND$|\bAND\s+AND\b)/i;
const unsupportedOperatorPattern = /\b(OR|NOT)\b/i;
const searchTermPattern = /^[\p{L}\p{N}_-]+$/u;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validationError(message: string, path = "q"): z.ZodError {
  return new z.ZodError([
    {
      code: "custom",
      message,
      path: [path],
    },
  ]);
}

function parseDate(value: string | undefined, label: string): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!datePattern.test(value)) {
    throw validationError(`Fecha ${label} inválida`, label);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw validationError(`Fecha ${label} inválida`, label);
  }

  return date;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function parseTerms(expression: string | undefined): string[] {
  if (expression === undefined) {
    return [];
  }

  const normalizedQuery = expression.replace(/\s+/g, " ").trim();

  if (normalizedQuery.length === 0) {
    throw validationError("El query de búsqueda es obligatorio");
  }

  if (
    malformedAndPattern.test(normalizedQuery) ||
    unsupportedOperatorPattern.test(normalizedQuery)
  ) {
    throw validationError("Query de búsqueda malformado");
  }

  const rawTerms = andBoundaryPattern.test(normalizedQuery)
    ? normalizedQuery.split(/\s+AND\s+/i)
    : [normalizedQuery];
  const terms = Array.from(new Set(rawTerms.map((term) => term.trim().toLowerCase())));

  if (terms.some((term) => !searchTermPattern.test(term))) {
    throw validationError("Query de búsqueda malformado");
  }

  return terms;
}

export function parseSearchQuery(input: unknown): ParsedSearchQuery {
  const request = SearchQueryRequestSchema.parse(input);
  const from = parseDate(request.from, "from");
  const to = parseDate(request.to, "to");
  const toExclusive = to ? addDays(to, 1) : undefined;

  if (from && to && from > to) {
    throw validationError("El rango de fechas es inválido");
  }

  const terms = Array.from(new Set([...parseTerms(request.q), ...parseTerms(request.class)]));

  return SearchQuerySchema.parse({
    terms,
    status: request.status,
    from,
    toExclusive,
    page: request.page,
    limit: request.limit,
    offset: (request.page - 1) * request.limit,
  });
}

export interface SearchReader {
  searchImagesByCategories(query: ParsedSearchQuery): Promise<SearchResponse>;
}

export class SearchService {
  public constructor(private readonly searchReader: SearchReader) {}

  public async search(input: unknown): Promise<SearchResponse> {
    const query = parseSearchQuery(input);
    const response = await this.searchReader.searchImagesByCategories(query);
    return SearchResponseSchema.parse(response);
  }
}
