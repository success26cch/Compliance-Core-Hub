import { ProtectedLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, AlertTriangle, Clock, CheckCircle, Upload, Phone, MapPin, Calendar, Camera, History } from "lucide-react";
import { useState, useRef } from "react";

interface NotificationCheck {
  employeeId: number;
  employeeName: string;
  employeePhone: string | null;
  employeeEmail: string | null;
  daysUntilExpiry: number;
  notificationType: '60_day' | '30_day' | '15_day' | '7_day';
  message: string;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
}

interface NotificationHistory {
  id: number;
  employeeId: number;
  notificationType: string;
  channel: string;
  message: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface ManagerAlert {
  employeeId: number;
  employeeName: string;
  expiryDate: string;
  hasNewCard: boolean;
}

export default function DOTNotifications() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ notifications: NotificationCheck[] }>({
    queryKey: ['/api/dot-notifications/check'],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<{ history: NotificationHistory[] }>({
    queryKey: ['/api/dot-notifications/history'],
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: ManagerAlert[] }>({
    queryKey: ['/api/dot-notifications/manager-alerts'],
  });

  const sendNotification = useMutation({
    mutationFn: async (notification: NotificationCheck) => {
      return apiRequest('POST', '/api/dot-notifications/send', {
        employeeId: notification.employeeId,
        notificationType: notification.notificationType,
        channel: notification.employeePhone ? 'sms' : 'email',
        message: notification.message,
        recipientPhone: notification.employeePhone,
        recipientEmail: notification.employeeEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dot-notifications/check'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dot-notifications/history'] });
      toast({ title: "Notification Queued", description: "The notification has been logged. SMS delivery requires Twilio setup." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    },
  });

  const uploadDotCard = useMutation({
    mutationFn: async ({ employeeId, imageData }: { employeeId: number; imageData: string }) => {
      return apiRequest('POST', `/api/employees/${employeeId}/dot-card`, { imageData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dot-notifications/manager-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setUploadDialogOpen(false);
      setImagePreview(null);
      setSelectedEmployee(null);
      toast({ title: "DOT Card Uploaded", description: "The new DOT medical card has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload DOT card", variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedEmployee || !imagePreview) return;
    uploadDotCard.mutate({ employeeId: selectedEmployee.id, imageData: imagePreview });
  };

  const getUrgencyBadge = (type: string) => {
    switch (type) {
      case '7_day':
        return <Badge variant="destructive">CRITICAL - 7 Days</Badge>;
      case '15_day':
        return <Badge className="bg-orange-500">URGENT - 15 Days</Badge>;
      case '30_day':
        return <Badge className="bg-yellow-500 text-black">30 Days</Badge>;
      case '60_day':
        return <Badge variant="secondary">60 Days</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-display text-primary">DOT Physical Notifications</h2>
            <p className="text-muted-foreground">Track and send reminders for expiring DOT medical cards</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending Notifications
              {notificationsData?.notifications && notificationsData.notifications.length > 0 && (
                <Badge variant="destructive" className="ml-1">{notificationsData.notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Manager Alerts
              {alertsData?.alerts && alertsData.alerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">{alertsData.alerts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Employees Needing Notification</CardTitle>
                <CardDescription>
                  DOT physicals expiring within 60 days that haven't received a reminder yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !notificationsData?.notifications || notificationsData.notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">All employees are up to date!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationsData.notifications.map((notification) => (
                        <TableRow key={`${notification.employeeId}-${notification.notificationType}`}>
                          <TableCell className="font-medium">{notification.employeeName}</TableCell>
                          <TableCell>
                            {notification.employeePhone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {notification.employeePhone}
                              </div>
                            )}
                            {notification.employeeEmail && (
                              <div className="text-sm text-muted-foreground">{notification.employeeEmail}</div>
                            )}
                          </TableCell>
                          <TableCell>{getUrgencyBadge(notification.notificationType)}</TableCell>
                          <TableCell>
                            {notification.clinicName ? (
                              <div className="text-sm">
                                <div className="font-medium">{notification.clinicName}</div>
                                {notification.clinicPhone && (
                                  <div className="text-muted-foreground">{notification.clinicPhone}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not configured</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => sendNotification.mutate(notification)}
                              disabled={sendNotification.isPending}
                              className="gap-1"
                              data-testid={`button-send-notification-${notification.employeeId}`}
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Manager Escalation Alerts
                </CardTitle>
                <CardDescription>
                  Employees with DOT physicals expiring in 7 days or less who haven't uploaded a new card
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !alertsData?.alerts || alertsData.alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No urgent alerts at this time</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alertsData.alerts.map((alert) => (
                      <div 
                        key={alert.employeeId}
                        className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-orange-800">{alert.employeeName}</h4>
                            <p className="text-sm text-orange-700">
                              DOT physical expires: {new Date(alert.expiryDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-orange-600 mt-1">
                              No new certificate on file. Contact driver to avoid OOS violations.
                            </p>
                          </div>
                          <Dialog open={uploadDialogOpen && selectedEmployee?.id === alert.employeeId} onOpenChange={(open) => {
                            setUploadDialogOpen(open);
                            if (!open) {
                              setSelectedEmployee(null);
                              setImagePreview(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEmployee({ id: alert.employeeId, name: alert.employeeName })}
                                className="gap-1"
                                data-testid={`button-upload-card-${alert.employeeId}`}
                              >
                                <Upload className="w-3 h-3" />
                                Upload New Card
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload DOT Medical Card</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Upload a photo of {alert.employeeName}'s new DOT medical card
                                </p>
                                
                                {imagePreview ? (
                                  <div className="relative">
                                    <img 
                                      src={imagePreview} 
                                      alt="DOT Card Preview" 
                                      className="w-full max-h-64 object-contain border rounded-lg"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => {
                                        setImagePreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <div 
                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Click to select or take a photo</p>
                                    <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                                  </div>
                                )}
                                
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleUploadSubmit}
                                  disabled={!imagePreview || uploadDotCard.isPending}
                                  data-testid="button-confirm-upload"
                                >
                                  {uploadDotCard.isPending ? "Uploading..." : "Save Card"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  Record of all DOT physical notifications sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !historyData?.history || historyData.history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications have been sent yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getUrgencyBadge(item.notificationType)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.channel.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'sent' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{item.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-accent">SMS Notifications</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  SMS delivery requires Twilio integration. Currently, notifications are logged but not delivered via SMS. 
                  Contact support to enable SMS notifications for your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
