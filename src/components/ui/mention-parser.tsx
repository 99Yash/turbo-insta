import Link from "next/link";
import * as React from "react";

/**
 * Parses text content and converts "@{username}" and "@username" mentions into clickable links
 * @param text The text content to parse
 * @returns JSX elements with mentions converted to links
 */
export function parseMentions(text: string): React.ReactNode {
  // Match both @{username} and @username formats
  // @{username} - exact match with curly braces
  // @username - match alphanumeric and underscore, stop at whitespace or punctuation
  const mentionRegex = /@\{([^}]+)\}|@([a-zA-Z0-9_]+)(?=\s|$|[^\w])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Simple debug to see what we're processing
  if (text.includes("@")) {
    console.log("Processing text with @:", text);
  }

  while ((match = mentionRegex.exec(text)) !== null) {
    // Extract username from either capture group
    const username = match[1] ?? match[2]; // match[1] for @{username}, match[2] for @username

    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the mention as a link with stronger styling
    parts.push(
      <Link
        key={`mention-${match.index}-${username}`}
        href={`/${username}`}
        className="font-semibold text-blue-500 transition-colors hover:text-blue-600"
        style={{ color: "#2563eb" }} // Force blue color as fallback
      >
        @{username}
      </Link>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 0 ? text : parts;
}

interface MentionTextProps {
  readonly text: string;
  readonly className?: string;
}

/**
 * Component that renders text with parsed mentions
 */
export function MentionText({
  text,
  className,
}: MentionTextProps): React.ReactElement {
  return <span className={className}>{parseMentions(text)}</span>;
}
