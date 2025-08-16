import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { getMadridTimezoneInfo, formatMadridDateTime } from '@/lib/timezone';

interface TimezoneInfoProps {
  className?: string;
  showCurrentTime?: boolean;
}

const TimezoneInfo: React.FC<TimezoneInfoProps> = ({ 
  className = "",
  showCurrentTime = false 
}) => {
  const timezoneInfo = getMadridTimezoneInfo();
  const currentTime = showCurrentTime ? formatMadridDateTime(new Date()) : null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-blue-600" />
      <div className="flex flex-col">
        <Badge variant="outline" className="text-xs">
          {timezoneInfo.name}
        </Badge>
        <span className="text-xs text-gray-500">
          {timezoneInfo.offset} {timezoneInfo.isDST ? '(Horario de Verano)' : '(Horario de Invierno)'}
        </span>
        {currentTime && (
          <span className="text-xs font-mono text-blue-600">
            {currentTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default TimezoneInfo;
