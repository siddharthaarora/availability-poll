"use client";

import TimezoneSelector from "./TimezoneSelector";

interface ParticipantFormProps {
  name: string;
  email: string;
  timezone: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onTimezoneChange: (tz: string) => void;
}

export default function ParticipantForm({
  name,
  email,
  timezone,
  onNameChange,
  onEmailChange,
  onTimezoneChange,
}: ParticipantFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3057]"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1">
          Timezone
        </label>
        <TimezoneSelector value={timezone} onChange={onTimezoneChange} />
      </div>
    </div>
  );
}
