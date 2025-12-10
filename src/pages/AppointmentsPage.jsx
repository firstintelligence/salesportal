import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [isConfigured, setIsConfigured] = useState(false);

  const agentNames = {
    "MM23": "MoMo",
    "TB0195": "Tadeo",
    "AA9097": "Donny",
    "HB6400": "Harry",
    "TP5142": "Tony"
  };

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    const storedAgentId = localStorage.getItem("agentId");
    
    if (!authenticated) {
      navigate("/");
      return;
    }
    
    setAgentId(storedAgentId);
    // Calendar integration is currently disabled - skip fetching
  }, [navigate]);

  const getStartDate = () => {
    if (viewMode === "month") {
      return startOfMonth(currentDate);
    } else if (viewMode === "week") {
      return startOfWeek(currentDate);
    } else {
      return startOfDay(currentDate);
    }
  };

  const getEndDate = () => {
    if (viewMode === "month") {
      return endOfMonth(currentDate);
    } else if (viewMode === "week") {
      return endOfWeek(currentDate);
    } else {
      return endOfDay(currentDate);
    }
  };

  const navigatePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start.dateTime || apt.start.date);
      return isSameDay(aptDate, date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-semibold text-sm p-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 p-2 border rounded-lg ${
                !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-card"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <div className="font-medium text-sm mb-1">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-1 bg-primary/10 rounded truncate"
                    title={apt.summary}
                  >
                    {apt.summary}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className={`border rounded-lg p-2 ${isToday ? "ring-2 ring-primary" : ""}`}>
              <div className="font-semibold text-sm mb-2">{format(day, "EEE d")}</div>
              <div className="space-y-2">
                {dayAppointments.map((apt, idx) => (
                  <div key={idx} className="text-sm p-2 bg-primary/10 rounded">
                    <div className="font-medium truncate">{apt.summary}</div>
                    <div className="text-xs text-muted-foreground">
                      {apt.start.dateTime && format(new Date(apt.start.dateTime), "h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div className="space-y-3">
        {dayAppointments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No appointments for this day</p>
        ) : (
          dayAppointments.map((apt, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{apt.summary}</h3>
                    {apt.description && (
                      <p className="text-sm text-muted-foreground mt-1">{apt.description}</p>
                    )}
                    {apt.location && (
                      <p className="text-sm text-muted-foreground mt-1">📍 {apt.location}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {apt.start.dateTime && (
                      <>
                        <div>{format(new Date(apt.start.dateTime), "h:mm a")}</div>
                        {apt.end.dateTime && (
                          <div>to {format(new Date(apt.end.dateTime), "h:mm a")}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => navigate("/landing")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tools
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {agentId === "MM23" ? "All Appointments" : "My Appointments"}
          </h1>
          <p className="text-muted-foreground">
            {agentId === "MM23" ? "Viewing all appointments from all agents" : `Showing appointments for ${agentNames[agentId] || agentId}`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={navigatePrevious}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle>
                  {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                  {viewMode === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
                  {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <Button variant="outline" size="icon" onClick={navigateNext}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>

            {!isConfigured ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  Google Calendar integration is not yet configured. Once enabled, you'll be able to view and manage your appointments here.
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {viewMode === "month" && renderMonthView()}
                {viewMode === "week" && renderWeekView()}
                {viewMode === "day" && renderDayView()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentsPage;
