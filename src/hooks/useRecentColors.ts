import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MAX_RECENT_COLORS = 8;

/**
 * useRecentColors Hook
 * 
 * Manages recent colors for a user, stored in Firebase.
 * Colors are stored per-user under /users/{userId}/recentColors
 * 
 * Features:
 * - Loads recent colors from Firebase on mount
 * - Adds new colors (max 8, FIFO queue)
 * - Prevents duplicate colors
 * - Persists to Firebase automatically
 */
export const useRecentColors = (userId: string | undefined) => {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent colors from Firebase
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadRecentColors = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const colors = data?.recentColors || [];
          setRecentColors(colors);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load recent colors:', error);
        setLoading(false);
      }
    };

    loadRecentColors();
  }, [userId]);

  // Add a new color to recent colors
  const addRecentColor = useCallback(async (color: string) => {
    if (!userId) return;

    // Normalize color to uppercase hex
    const normalizedColor = color.toUpperCase();

    setRecentColors(prevColors => {
      // Remove color if it already exists (to move it to front)
      const filteredColors = prevColors.filter(c => c !== normalizedColor);
      
      // Add new color to front
      const newColors = [normalizedColor, ...filteredColors];
      
      // Keep only first 8 colors (FIFO)
      const limitedColors = newColors.slice(0, MAX_RECENT_COLORS);
      
      // Persist to Firebase (async, non-blocking)
      const userDocRef = doc(db, 'users', userId);
      setDoc(userDocRef, { recentColors: limitedColors }, { merge: true })
        .catch(error => {
          console.error('Failed to save recent colors:', error);
        });
      
      return limitedColors;
    });
  }, [userId]);

  return {
    recentColors,
    addRecentColor,
    loading,
  };
};

