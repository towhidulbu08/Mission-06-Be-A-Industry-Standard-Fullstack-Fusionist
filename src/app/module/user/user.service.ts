import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  cloudinary.uploader
    .upload_stream(
      {
        resource_type: "auto",
      },
      async (err, result) => {
        if (err) {
          console.log("err", err);
          throw new Error(err.message);
        }
        console.log("result", result);
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {},
        });
      },
    )
    .end(buffer);
};

export const UserServices = {
  uploadProfileImage,
};
