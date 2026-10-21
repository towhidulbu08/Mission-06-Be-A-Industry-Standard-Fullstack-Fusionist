import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import upload from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { DoctorController } from "./doctor.controller";

const router = Router();

router.post(
	"/apply-as-doctor",
	// validateRequest(UserValidation.ResetPasswordZodSchema),
	upload.fields([
		{
			name: "resume",
			maxCount: 1,
		},

		{
			name: "additionalFiles",
			maxCount: 10,
		},
	]),

	DoctorController.applyAsDoctor,
);

router.post(
	"/apply-as-doctor/verify-email",
	DoctorController.verifyDoctorEmail,
);

router.post(
	"/approve-doctor",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	DoctorController.approveDoctor,
);

router.get(
	"/all-doctors",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	DoctorController.getAllDoctors,
);
export const DoctorRoutes = router;
