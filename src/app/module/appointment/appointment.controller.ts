import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const bookAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "",
      data: {},
    });
  },
);

export const AppointmentController = {
  bookAppointment,
};
