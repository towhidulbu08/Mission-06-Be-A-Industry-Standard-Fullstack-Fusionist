import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppointmentServices } from "./appointment.service";

const bookAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AppointmentServices.bookAppointment();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Fetched Successfully",
      data: result,
    });
  },
);

export const AppointmentController = {
  bookAppointment,
};
