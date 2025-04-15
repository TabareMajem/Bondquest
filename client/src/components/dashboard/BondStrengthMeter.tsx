interface BondStrengthMeterProps {
  percentage: number;
}

export default function BondStrengthMeter({ percentage }: BondStrengthMeterProps) {
  // Calculate the stroke-dashoffset for the progress ring
  // Circumference = 2πr = 2 * 3.14159 * 60 = ~376.99
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="flex justify-center mb-4">
      <div className="relative h-36 w-36 flex items-center justify-center">
        {/* Progress Ring */}
        <svg className="transform -rotate-90" width="136" height="136">
          {/* Background circle */}
          <circle
            className="progress-ring-circle-bg"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="8"
            fill="transparent"
            r="60"
            cx="68"
            cy="68"
          />
          {/* Progress circle */}
          <circle
            className="progress-ring-circle"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="60"
            cx="68"
            cy="68"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd500" />
              <stop offset="100%" stopColor="#ff6bbd" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold text-white">{percentage}%</span>
          <span className="text-sm text-white opacity-80">Bond Strength</span>
        </div>
      </div>
    </div>
  );
}
