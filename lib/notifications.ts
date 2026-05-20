import mongoose from 'mongoose';
import { Notification, INotification } from "./models/Notification"; 

export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  type: INotification['type'],
  title: string,
  message: string,
  metadata?: Record<string, any>,
  session?: mongoose.ClientSession
) => {
  try {
    // When using a session, pass the documents as an array to .create()
    const result = await Notification.create([{
      userId,
      type,
      title,
      message,
      metadata,
      isRead: false
    }], { session });

    return result[0];
  } catch (error) {
    console.error("NOTIFICATION_CREATION_ERROR:", error);
    throw error; // Re-throw to allow transaction abort in parent function
  }
};


export const getUserNotifications = async (userId: string, limit = 20) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 }) // Newest first
    .limit(limit)
    .lean(); // .lean() makes it faster by returning plain JS objects
};


export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};