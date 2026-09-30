'use client';

import { useEffect, useState } from 'react';
import StudentOnboardingModal from '@/components/StudentOnboardingModal';
import { OPEN_STUDENT_GUIDE_EVENT } from '@/lib/studentGuide';

export default function StudentOnboardingHost() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openGuide = () => setIsOpen(true);
    window.addEventListener(OPEN_STUDENT_GUIDE_EVENT, openGuide);
    return () => window.removeEventListener(OPEN_STUDENT_GUIDE_EVENT, openGuide);
  }, []);

  return <StudentOnboardingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
