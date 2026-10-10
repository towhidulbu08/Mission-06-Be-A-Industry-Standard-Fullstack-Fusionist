import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  console.log("req.file", req.file);

  if (!req.file) {
    throw new Error("No File Found");
  }
  const userId = req.user?.userId as string;
  const result = await UserServices.uploadProfileImage(
    req.file?.buffer,
    userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email Verified Successfully",
    data: result,
  });
});
export const UserController = {
  uploadProfileImage,
};
