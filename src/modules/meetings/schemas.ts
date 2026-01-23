import * as z from "zod";

export const MeetingSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  title: z.string(),
  slug: z.string(),
  city: z.string(),
  country: z.string(),
  countryCode: z.string(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  hostName: z.string().nullable(),
  hostLabId: z.string().uuid().nullable(),
  summary: z.string().nullable(),
  content: z.any().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  coverAssetId: z.string().uuid().nullable(),
  topicsPdfAssetId: z.string().uuid().nullable(),
  authorId: z.string().uuid().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMeetingSchema = z.object({
  number: z.number().int().min(1, "Meeting number is required"),
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  hostName: z.string().optional(),
  hostLabId: z.string().uuid().optional(),
  summary: z.string().optional(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  coverAssetId: z.string().uuid().optional(),
  topicsPdfAssetId: z.string().uuid().optional(),
});

export const UpdateMeetingSchema = CreateMeetingSchema.partial();

export const ListMeetingsQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type Meeting = z.infer<typeof MeetingSchema>;
export type CreateMeeting = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeeting = z.infer<typeof UpdateMeetingSchema>;
