-- CreateEnum
CREATE TYPE "EquipmentLoanStatus" AS ENUM ('Loaned', 'Returned', 'Damaged');

-- CreateTable
CREATE TABLE "equipment_loan" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "status" "EquipmentLoanStatus" NOT NULL,
    "loan_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "member_id" TEXT NOT NULL,

    CONSTRAINT "equipment_loan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment_loan" ADD CONSTRAINT "equipment_loan_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
