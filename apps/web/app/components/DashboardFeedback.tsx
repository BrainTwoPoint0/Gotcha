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
    plan?: string;
    accountAgeDays?: number;
    onboarded?: boolean;
    totalResponses?: number;
  };
  mode?: 'feedback' | 'vote' | 'poll' | 'nps';
  voteLabels?: { up: string; down: string };
  options?: string[];
  allowMultiple?: boolean;
  npsQuestion?: string;
  /** When true, shows submitted state and allows review/edit instead of new submission (default: false) */
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
  npsQuestion,
  onePerUser = false,
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
      npsQuestion={npsQuestion}
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
