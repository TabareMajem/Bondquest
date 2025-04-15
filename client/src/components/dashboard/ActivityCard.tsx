import { Calendar, Star, Heart } from "lucide-react";
import { Activity } from "@shared/schema";

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  // Helper to determine the icon and color based on activity type
  const getIconAndColor = () => {
    switch (activity.type) {
      case "quiz":
        return {
          icon: <Star className="w-6 h-6 text-secondary-600" />,
          bgColor: "bg-secondary-100",
        };
      case "check_in":
        return {
          icon: <Heart className="w-6 h-6 text-accent-600" />,
          bgColor: "bg-accent-100",
        };
      case "achievement":
        return {
          icon: <Calendar className="w-6 h-6 text-primary-600" />,
          bgColor: "bg-primary-100",
        };
      default:
        return {
          icon: <Star className="w-6 h-6 text-primary-600" />,
          bgColor: "bg-primary-100",
        };
    }
  };

  // Get the icon and color
  const { icon, bgColor } = getIconAndColor();

  // Format activity type for display
  const formatActivityType = (type: string) => {
    switch (type) {
      case "quiz":
        return "Quiz";
      case "check_in":
        return "Check-In";
      case "achievement":
        return "Achievement";
      default:
        return type;
    }
  };

  return (
    <div className="card bg-white rounded-xl p-4 shadow-sm mb-3 border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
      <div className="flex items-center">
        <div className={`${bgColor} p-2 rounded-lg mr-3`}>
          {icon}
        </div>
        <div className="flex-grow">
          <h4 className="font-medium text-gray-700">{formatActivityType(activity.type)}</h4>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">
              {new Date(activity.createdAt).toLocaleDateString()}
            </p>
            {activity.points && (
              <p className="text-sm font-medium text-primary-600">{activity.points} points</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
