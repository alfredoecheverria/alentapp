-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pendiente', 'Pago', 'Cancelado');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_date" DATE NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
