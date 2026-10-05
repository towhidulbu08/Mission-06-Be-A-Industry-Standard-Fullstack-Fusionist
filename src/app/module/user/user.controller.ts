import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  console.log("req.file", req.file);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email Verified Successfully",
    data: null,
  });
});
export const UserController = {
  uploadProfileImage,
};
