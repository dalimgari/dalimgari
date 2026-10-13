/**
 * Replace with generated Supabase Database types after comparing the live
 * schema and repository migrations. Do not hand-invent table or policy shapes.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
