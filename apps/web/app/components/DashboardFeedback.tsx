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
  mode?: 'feedback' | 'vote' | 'poll';
  voteLabels?: { up: string; down: string };
  options?: string[];
  allowMultiple?: boolean;
  /** When true, shows submitted state and allows review/edit instead of new submission (default: true for dashboard) */
  onePerUser?: boolean;
}

export function DashboardFeedback({
  elementId,
  promptText,
  userEmail,
  userName,
  userProfile,
  mode = 'feedback',
  voteLabels,
  options,
  allowMultiple,
  onePerUser = true,
}: DashboardFeedbackProps) {
  return (
    <Gotcha
      elementId={elementId}
      mode={mode}
      position="inline"
      theme="light"
      showOnHover={false}
      size="sm"
      promptText={promptText}
      voteLabels={voteLabels}
      options={options}
      allowMultiple={allowMultiple}
      {...(onePerUser !== undefined ? { onePerUser } : {})}
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
