'use client';

import { Gotcha } from 'gotcha-feedback';

interface DashboardFeedbackProps {
  elementId: string;
  promptText: string;
  userEmail?: string;
  userName?: string;
  userProfile?: {
    companySize?: string;
    role?: string;
    industry?: string;
    useCase?: string;
  };
}

export function DashboardFeedback({
  elementId,
  promptText,
  userEmail,
  userName,
  userProfile,
}: DashboardFeedbackProps) {
  return (
    <Gotcha
      elementId={elementId}
      mode="feedback"
      position="inline"
      theme="light"
      showOnHover={false}
      size="sm"
      promptText={promptText}
      user={
        userEmail
          ? {
              id: userEmail,
              name: userName ?? undefined,
              ...userProfile,
            }
          : undefined
      }
    />
  );
}
