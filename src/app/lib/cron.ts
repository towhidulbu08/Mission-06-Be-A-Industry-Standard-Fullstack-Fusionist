import cron from "node-cron";

cron.schedule("* */10 * * * *", () => {
  //prisma business logic to run every 10 minutes(doctor delete)

  console.log("Doctor Delete");
});

export const deleteUnverifiedDoctors = async () => {
  cron.schedule("*/2 * * * * *", () => {
    //prisma business logic to run every 10 minutes(doctor delete)

    console.log("Doctor Delete");
  });
};
