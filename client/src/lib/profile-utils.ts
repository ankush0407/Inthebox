import type { User } from "@shared/schema";

export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  
  // Check if user has both fullName and phoneNumber
  return !!(user.fullName && user.fullName.trim() && 
           user.phoneNumber && user.phoneNumber.trim());
}

export function getProfileCompletionMessage(): string {
  return "Please complete your profile with your name and phone number before placing an order.";
}