"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedUser } from "~/contexts/user-context";

/**
 * Type for presence member data from Ably
 */
type PresenceMember = {
  readonly clientId: string;
  readonly data?: unknown;
  readonly action: "enter" | "leave" | "update" | "present";
};

/**
 * Hook for managing user presence using Ably
 * This tracks which users are currently active on the app in real-time
 * Uses pure pub/sub events without intervals for true real-time updates
 */
export function usePresence() {
  const client = useAbly();
  const user = useAuthenticatedUser();
  const [presenceMembers, setPresenceMembers] = useState<Set<string>>(
    new Set(),
  );
  const [isEntered, setIsEntered] = useState(false);

  // Enhanced presence data with activity tracking
  const getPresenceData = useCallback(() => {
    return {
      userId: user?.id,
      username: user?.username,
      name: user?.name,
      imageUrl: user?.imageUrl,
      lastActive: new Date().toISOString(),
      isVisible: !document.hidden,
      userAgent: navigator.userAgent,
    };
  }, [user]);

  // Update presence data immediately when needed
  const updatePresence = useCallback(async () => {
    if (!client || !user || !isEntered) return;

    try {
      const presenceChannel = client.channels.get("global-presence");
      await presenceChannel.presence.update(getPresenceData());
      console.log("🔄 [usePresence] Updated presence data");
    } catch (error) {
      console.error("❌ [usePresence] Failed to update presence:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, user, isEntered]);

  // Enter presence channel and set up real-time event handlers
  useEffect(() => {
    if (!client || !user || isEntered) return;

    const presenceChannel = client.channels.get("global-presence");

    // Enter presence with enhanced user data
    presenceChannel.presence
      .enter(getPresenceData())
      .then(() => {
        console.log("✅ [usePresence] Entered presence channel");
        setIsEntered(true);
      })
      .catch((error) => {
        console.error("❌ [usePresence] Failed to enter presence:", error);
      });

    // Handle browser visibility changes - immediate real-time updates
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from the app - immediately update presence
        console.log("👁️ [usePresence] User went away from app");
        updatePresence().catch((error) => {
          console.error(
            "❌ [usePresence] Failed to update presence on hide:",
            error,
          );
        });
      } else {
        // User came back to the app - immediately update presence
        console.log("👁️ [usePresence] User returned to app");
        updatePresence().catch((error) => {
          console.error(
            "❌ [usePresence] Failed to update presence on show:",
            error,
          );
        });
      }
    };

    // Handle page unload/close - immediate presence exit
    const handleBeforeUnload = () => {
      if (isEntered) {
        try {
          // Use synchronous leave for immediate cleanup
          void presenceChannel.presence.leave();
          console.log("🔇 [usePresence] Left presence on page unload");
        } catch (error) {
          console.error(
            "❌ [usePresence] Failed to leave presence on unload:",
            error,
          );
        }
      }
    };

    // Handle focus/blur events for additional real-time detection
    const handleFocus = () => {
      console.log("🎯 [usePresence] Window focused");
      updatePresence().catch((error) => {
        console.error(
          "❌ [usePresence] Failed to update presence on focus:",
          error,
        );
      });
    };

    const handleBlur = () => {
      console.log("🎯 [usePresence] Window blurred");
      updatePresence().catch((error) => {
        console.error(
          "❌ [usePresence] Failed to update presence on blur:",
          error,
        );
      });
    };

    // Add event listeners for real-time presence detection
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);

      if (isEntered) {
        presenceChannel.presence
          .leave()
          .then(() => {
            console.log("🔇 [usePresence] Left presence channel");
            setIsEntered(false);
          })
          .catch((error) => {
            console.error("❌ [usePresence] Failed to leave presence:", error);
          });
      }
    };
  }, [client, user, isEntered, updatePresence, getPresenceData]);

  // Subscribe to presence events for real-time updates
  useEffect(() => {
    if (!client || !user) return;

    const presenceChannel = client.channels.get("global-presence");

    const handlePresenceMessage = (presenceMessage: Ably.PresenceMessage) => {
      const member = presenceMessage as PresenceMember;

      if (member.clientId === user.id) {
        // Don't track our own presence
        return;
      }

      console.log(`🔔 [usePresence] Real-time presence event:`, {
        action: member.action,
        clientId: member.clientId,
        data: member.data,
        timestamp: new Date().toISOString(),
      });

      setPresenceMembers((prev) => {
        const newSet = new Set(prev);

        if (member.action === "enter" || member.action === "present") {
          newSet.add(member.clientId);
          console.log(`🟢 [usePresence] User ${member.clientId} is now ONLINE`);
        } else if (member.action === "leave") {
          newSet.delete(member.clientId);
          console.log(`🔴 [usePresence] User ${member.clientId} went OFFLINE`);
        } else if (member.action === "update") {
          // User is still present but updated their data
          console.log(
            `🔄 [usePresence] User ${member.clientId} updated presence data`,
          );
        }

        return newSet;
      });
    };

    // Subscribe to all presence events for real-time updates
    void presenceChannel.presence.subscribe(handlePresenceMessage);

    // Get current presence members on mount
    presenceChannel.presence
      .get()
      .then((members) => {
        const currentMembers = new Set(
          members
            .filter((member) => member.clientId !== user.id)
            .map((member) => member.clientId),
        );

        console.log(
          "📋 [usePresence] Current online members:",
          Array.from(currentMembers),
        );
        setPresenceMembers(currentMembers);
      })
      .catch((error) => {
        console.error(
          "❌ [usePresence] Failed to get current presence:",
          error,
        );
      });

    return () => {
      presenceChannel.presence.unsubscribe(handlePresenceMessage);
      console.log("🔇 [usePresence] Unsubscribed from presence events");
    };
  }, [client, user]);

  /**
   * Check if a specific user is currently online/present
   */
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      const isOnline = presenceMembers.has(userId);
      console.log(
        `🔍 [usePresence] Checking if user ${userId} is online: ${isOnline}`,
      );
      return isOnline;
    },
    [presenceMembers],
  );

  /**
   * Get all currently online user IDs
   */
  const getOnlineUsers = useCallback((): string[] => {
    return Array.from(presenceMembers);
  }, [presenceMembers]);

  return {
    isUserOnline,
    getOnlineUsers,
    onlineCount: presenceMembers.size,
    isPresenceActive: isEntered,
  };
}
