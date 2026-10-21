import { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
	const currentUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			imagePublicId: true,
			imageUrl: true,
		},
	});
	//1.Wrap the stream upload in a Promise
	const uploadResult = await new Promise<UploadApiResponse>((res, rej) => {
		cloudinary.uploader
			.upload_stream(
				{
					resource_type: "auto",
				},
				(err, result) => {
					if (err) {
						console.log("err", err);
						return rej(err);
					}
					if (!result) {
						return rej(
							new AppError(
								httpStatus.INTERNAL_SERVER_ERROR,
								"No Result Returned From Cloudinary",
							),
						);
					}
					res(result);
					console.log("result", result);
				},
			)
			.end(buffer);
	});

	//2. Update the database using the resolved result

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			imageUrl: uploadResult?.secure_url,
			imagePublicId: uploadResult?.public_id,
		},
		omit: {
			password: true,
		},
	});
	// console.log("updatedUser", updatedUser);

	if (currentUser?.imagePublicId && currentUser.imageUrl) {
		await cloudinary.uploader.destroy(currentUser.imagePublicId);
	}

	return updatedUser;
};

export const UserServices = {
	uploadProfileImage,
};
