'use client';

import { Gotcha } from 'gotcha-feedback';

interface GlobalBugReporterProps {
  userEmail?: string;
  userName?: string;
  plan?: string;
}

export function GlobalBugReporter({ userEmail, userName, plan }: GlobalBugReporterProps) {
  return (
    <div className="fixed bottom-8 right-10 z-50 hidden md:block">
      <Gotcha
        elementId="gotcha-global-bug-report"
        mode="feedback"
        position="inline"
        theme="light"
        size="md"
        promptText="Report a bug or share feedback"
        showRating={false}
        enableBugFlag
        showOnHover={false}
        onePerUser={false}
        customStyles={{
          modal: {
            left: 'auto',
            right: 40,
            transform: 'none',
          },
        }}
        user={
          userEmail
            ? {
                id: userEmail,
                email: userEmail,
                name: userName ?? undefined,
                plan: plan ?? undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
