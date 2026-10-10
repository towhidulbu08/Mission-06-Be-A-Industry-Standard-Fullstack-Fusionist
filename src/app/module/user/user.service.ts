import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
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
            return rej(new Error("No Result Returned From Cloudinary"));
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
  console.log("updatedUser", updatedUser);

  return updatedUser;
};

export const UserServices = {
  uploadProfileImage,
};
