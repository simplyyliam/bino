import { defaultStoreNumber, nextStoreNumber as computeNext } from "@bino/data";
import { prisma } from "../db.js";
import { ApiError } from "./errors.js";

type SystemLike = Parameters<typeof computeNext>[0] & { id: string };

const storagesOn = (systemId: string, exceptStorageId?: string) =>
  prisma.storage.findMany({
    where: { locationSystemId: systemId, ...(exceptStorageId ? { NOT: { id: exceptStorageId } } : {}) },
    include: { building: { select: { name: true } } },
  });

export async function nextStoreNumber(system: SystemLike) {
  return computeNext(system, await storagesOn(system.id));
}

export async function assertStoreNumberFree(system: SystemLike, storeNumber: number, exceptStorageId?: string) {
  const fallback = defaultStoreNumber(system);
  const clash = (await storagesOn(system.id, exceptStorageId)).find((s) => (s.storeNumber ?? fallback) === storeNumber);
  if (clash) {
    throw new ApiError(409, `Store ${storeNumber} is already used by ${clash.building.name}. Pick another number.`);
  }
}
