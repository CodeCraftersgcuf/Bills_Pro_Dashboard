import React from "react";

const GREEN = "#1B800F";
const STAT_CARD_LEFT = "#1B800F";
const STAT_CARD_RIGHT = "#18D218CC";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex min-h-[140px] overflow-hidden rounded-3xl shadow-md md:min-h-[160px]">
      <div
        className="flex w-[34%] min-w-[108px] flex-shrink-0 flex-col justify-center gap-3 px-4 py-4 md:px-5 md:py-5"
        style={{ backgroundColor: STAT_CARD_LEFT }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white md:h-12 md:w-12">
          <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} style={{ color: GREEN }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-white md:text-[15px]">{label}</p>
          <p className="mt-1 text-xs text-white/80 md:text-sm">{hint}</p>
        </div>
      </div>
      <div
        className="flex flex-1 items-center justify-center px-3 py-4 md:px-4 md:py-5"
        style={{ backgroundColor: STAT_CARD_RIGHT }}
      >
        <p className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {value}
        </p>
      </div>
    </div>
  );
}

export default StatCard;
