-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "user" TEXT,
    "ip" TEXT NOT NULL,
    "mac" TEXT,
    "sshPort" INTEGER NOT NULL DEFAULT 22,
    "sshUser" TEXT NOT NULL DEFAULT 'admin',
    "sshPass" TEXT NOT NULL DEFAULT '',
    "priceWeekly" INTEGER NOT NULL DEFAULT 800,
    "priceMonthly" INTEGER NOT NULL DEFAULT 2800,
    "rentedAt" TEXT,
    "expiresAt" TEXT,
    "specCPU" TEXT NOT NULL DEFAULT 'Dual Xeon E5-2686 V4 36/72',
    "specGPU" TEXT NOT NULL DEFAULT 'RTX 3060 12GB',
    "specRAM" TEXT NOT NULL DEFAULT '128 GB',
    "specSSD" TEXT NOT NULL DEFAULT '1TB NVMe',
    "anydeskId" TEXT,
    "anydeskPass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "registeredAt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "rentingMachine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'PromptPay',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TEXT NOT NULL,
    "note" TEXT,
    "createdAtDb" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machines_name_key" ON "machines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
