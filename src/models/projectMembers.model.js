import mongoose, { Schema } from "mongoose";
import { AvailableRolesEnum, UserRolesEnum } from "../utils/constants.js";

const projectMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: AvailableRolesEnum,
      default: UserRolesEnum.MEMBER,
    },
  },
  { timestamps: true },
);

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);

export default ProjectMember;
