import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatusEnum, TaskStatusEnum } from "../utils/constants";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: AvailableTaskStatusEnum,
      default: TaskStatusEnum.TODO,
    },
    attachments: [
      {
        url: String,
        mimetype: String,
        size: Number,
      },
    ],
    default: [],
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
