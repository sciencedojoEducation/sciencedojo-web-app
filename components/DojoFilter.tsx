import React from "react";

interface DojoFilterProps {
  text: string;
  className?: string;
}

/**
 * A safety-first component that redacts sensitive contact info (phone/email)
 * to ensure all business stays on the ScienceDojo platform.
 */
export default function DojoFilter({ text, className = "" }: DojoFilterProps) {
  // Regex for emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // Regex for phone numbers (broad enough for UK/US/Intl)
  // Logic: Matches patterns like +44 7911 123456, 07911 123456, (555) 555-5555, 555-555-5555, etc.
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?(\d{3,4}[-.\s]?){2,3}\d/g;

  const redact = (content: string) => {
    return content
      .replace(emailRegex, "[REDACTED EMAIL]")
      .replace(phoneRegex, "[REDACTED PHONE]");
  };

  const redactedText = redact(text);

  return (
    <span className={className}>
      {redactedText}
    </span>
  );
}

/** Utility function for use outside of JSX if needed */
export const redactContactInfo = (text: string) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?(\d{3,4}[-.\s]?){2,3}\d/g;
  
  return text
    .replace(emailRegex, "[REDACTED EMAIL]")
    .replace(phoneRegex, "[REDACTED PHONE]");
};
