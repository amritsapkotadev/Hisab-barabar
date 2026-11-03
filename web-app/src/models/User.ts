import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  phone: string
  password?: string
  otp?: string | null
  otpExpires?: Date | null
  isVerified: boolean
  budget: number
  fcmToken?: string
  googleId?: string
  picture?: string
  customPictureKey?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, unique: true, required: true },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId
      },
    },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    fcmToken: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    picture: { type: String },
    customPictureKey: { type: String },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)

export default User
