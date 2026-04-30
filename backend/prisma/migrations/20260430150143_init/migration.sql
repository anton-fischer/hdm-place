-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "pixelCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pixel" (
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placedBy" TEXT NOT NULL,

    CONSTRAINT "Pixel_pkey" PRIMARY KEY ("x","y")
);

-- AddForeignKey
ALTER TABLE "Pixel" ADD CONSTRAINT "Pixel_placedBy_fkey" FOREIGN KEY ("placedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
