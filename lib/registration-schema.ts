
import { z } from "zod";

export const delegateSchema = z.object({
  fullName: z.string().trim().min(2, "Delegate name is required").max(150),
  nickname: z.string().trim().max(50).optional().default(""),
  age: z.number().int().min(1).max(100),
  sex: z.enum(["Male", "Female"]),
  category: z.enum([
    "Elementary",
    "Junior High School",
    "Senior High School",
    "College",
    "Career/Working",
  ]),
  discount: z.enum([
    "none",
    "pastor_child",
    "missionary_child",
    "bible_school_student",
  ]),
});

export const registrationSchema = z.object({
  churchName: z.string().trim().min(2).max(150),
  churchAddress: z.string().trim().min(5).max(300),
  representativeName: z.string().trim().min(2).max(150),
  contactNumber: z.string().trim().min(7).max(20),
  emailAddress: z.union([
    z.string().trim().email().max(254),
    z.literal(""),
  ]),
  gcashReference: z.string().trim().min(6).max(30),
  delegates: z.array(delegateSchema).min(1).max(100),
});
