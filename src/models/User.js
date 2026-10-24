import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // nunca se devuelve en las consultas salvo que se pida
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
