import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'APPROVAL' | 'REJECTION' | 'COMPLETED';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'APPROVAL', 'REJECTION', 'COMPLETED'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object },
}, { timestamps: true });

// Export as Notification
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);