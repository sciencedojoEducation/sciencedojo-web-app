export default function AvailabilityCalendar() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Mock grid 7 days x 5 time slots
  const slots = [
    ["10:00 AM", true, true, false, true, true, false, false],
    ["12:00 PM", true, false, true, true, false, true, false],
    ["02:00 PM", false, true, true, false, true, true, true],
    ["04:00 PM", true, true, false, true, true, false, true],
    ["06:00 PM", true, false, true, false, true, true, false],
  ];

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[600px]">
        {/* Header Row */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="col-span-1"></div> {/* Empty top-left corner */}
          {days.map((day) => (
            <div key={day} className="text-center font-bold text-secondary/70 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="flex flex-col gap-2">
          {slots.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-2">
              {/* Time Label */}
              <div className="col-span-1 flex items-center justify-end pr-4 text-sm font-medium text-secondary/60">
                {row[0]}
              </div>
              
              {/* Availability Cells */}
              {row.slice(1).map((isAvailable, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-12 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    isAvailable 
                      ? "bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary" 
                      : "bg-surface border-secondary/10 opacity-50 cursor-not-allowed"
                  }`}
                >
                   {isAvailable && <span className="text-xs font-bold">+</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
