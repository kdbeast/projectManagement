import { Router } from "express";
import {
  createProjectValidation,
  addMemberToProjectValidation,
} from "../validators/index.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  getProjectMembers,
  addMembersToProject,
  updateProjectMemberRole,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { AvailableRolesEnum, UserRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(getProjects)
  .post(createProjectValidation(), validate, createProject);

router
  .route("/:projectId")
  .get(
    validateProjectPermission(AvailableRolesEnum, getProjectById),
    getProjects,
  )
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    createProjectValidation(),
    validate,
    updateProject,
  )
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectValidation(),
    validate,
    deleteProject,
  );

router
  .route("/:projectId/members")
  .get(getProjectMembers)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMemberToProjectValidation(),
    validate,
    addMembersToProject,
  );

router
  .route("/:projectId/members/:userId")
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateProjectMemberRole,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

export default router;
