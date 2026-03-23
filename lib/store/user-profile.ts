/**
 * User Profile Store
 * Persists avatar, nickname & bio to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

/** Predefined avatar options */
export const AVATAR_OPTIONS = [
  '/avatars/user.png',
  '/avatars/teacher-2.png',
  '/avatars/assist-2.png',
  '/avatars/clown-2.png',
  '/avatars/curious-2.png',
  '/avatars/note-taker-2.png',
  '/avatars/thinker-2.png',
] as const;

export interface ClassProfile {
  id: string;
  name: string;
  personality?: string;
  background?: string;
  avatar?: string;
}

export interface UserProfileState {
  /** Local avatar path or data-URL (for custom uploads) */
  avatar: string;
  nickname: string;
  bio: string;
  /** Professional/educational background (e.g., "3rd year CS student", "marketing manager") */
  background: string;
  /** Career aspiration (e.g., "become a data scientist", "transition to product management") */
  careerAspiration: string;
  setAvatar: (avatar: string) => void;
  setNickname: (nickname: string) => void;
  setBio: (bio: string) => void;
  setBackground: (background: string) => void;
  setCareerAspiration: (aspiration: string) => void;
  classProfiles: ClassProfile[];
  addClassProfile: (profile: Omit<ClassProfile, 'id'>) => void;
  removeClassProfile: (id: string) => void;
  importClassProfiles: (profiles: Omit<ClassProfile, 'id'>[]) => void;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      avatar: AVATAR_OPTIONS[0],
      nickname: '',
      bio: '',
      background: '',
      careerAspiration: '',
      setAvatar: (avatar) => set({ avatar }),
      setNickname: (nickname) => set({ nickname }),
      setBio: (bio) => set({ bio }),
      setBackground: (background) => set({ background }),
      setCareerAspiration: (aspiration) => set({ careerAspiration: aspiration }),
      classProfiles: [],
      addClassProfile: (profile) => set((s) => ({
        classProfiles: [...s.classProfiles, { ...profile, id: nanoid(8) }],
      })),
      removeClassProfile: (id) => set((s) => ({
        classProfiles: s.classProfiles.filter((p) => p.id !== id),
      })),
      importClassProfiles: (profiles) => set((s) => ({
        classProfiles: [
          ...s.classProfiles,
          ...profiles.filter((p) => p.name?.trim()).map((p) => ({ ...p, id: nanoid(8) })),
        ],
      })),
    }),
    {
      name: 'user-profile-storage',
    },
  ),
);
