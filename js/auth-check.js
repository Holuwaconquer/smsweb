// Reusable Authentication Check Helper
// This properly waits for Supabase to restore the session before checking auth

/**
 * Properly check authentication using onAuthStateChange
 * This waits for Supabase to restore the session from storage
 * 
 * Usage:
 * let currentUser = null;
 * document.addEventListener("DOMContentLoaded", async () => {
 *   currentUser = await waitForAuth();
 *   // Then call your load functions
 * });
 */
async function waitForAuth() {
  return new Promise((resolve) => {
    try {
      console.log("Starting authentication check...");
      
      // Use onAuthStateChange for proper session restoration
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state event:", event, "- User:", session?.user?.email || "none");
          
          if (session && session.user) {
            console.log("✅ User authenticated:", session.user.email);
            
            // Cleanup listener and resolve with user
            subscription?.unsubscribe();
            resolve(session.user);
          } else if (event === "INITIAL_SESSION") {
            // No user found on initial check
            console.log("❌ No authenticated user - redirecting to login");
            
            // Cleanup listener
            subscription?.unsubscribe();
            
            // Redirect to auth page
            window.location.href = "../auth.html";
            resolve(null);
          }
          // For other events (SIGNED_OUT, etc), just wait for INITIAL_SESSION to complete
        }
      );
    } catch (error) {
      console.error("Authentication check failed:", error);
      window.location.href = "../auth.html";
      resolve(null);
    }
  });
}

/**
 * Check if user is currently authenticated (synchronous check)
 * Use this if you just need to verify the currentUser is set
 */
function isAuthenticated(currentUser) {
  return currentUser && currentUser.id;
}

/**
 * Redirect to login if not authenticated
 * Useful for additional checks in event handlers
 */
function requireAuth(currentUser) {
  if (!currentUser) {
    alert("Please sign in to continue");
    window.location.href = "../auth.html";
    return false;
  }
  return true;
}
