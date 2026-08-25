import {z} from 'zod';

export const getDeviceDto = z.object({
  user_id: z.string().uuid(),
});

export type GetDeviceDtoType = z.infer<typeof getDeviceDto>;