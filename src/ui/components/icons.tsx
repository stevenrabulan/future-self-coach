/** Small stroke icons shared by the stage controls, transcript and composer. Decorative: buttons carry aria-labels. */
import type React from 'react';

function Icon({ size = 18, children }: { size?: number; children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const SpeakerOn = (): React.JSX.Element => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);

export const SpeakerOff = (): React.JSX.Element => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Icon>
);

export const PlayIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M8 5.5v13l10.5-6.5L8 5.5z" />
  </Icon>
);

export const SendIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);
