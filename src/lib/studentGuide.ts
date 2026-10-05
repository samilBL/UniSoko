'use client';

export const OPEN_STUDENT_GUIDE_EVENT = 'unisoko:open-student-guide';

export function openStudentGuide() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_STUDENT_GUIDE_EVENT));
}
