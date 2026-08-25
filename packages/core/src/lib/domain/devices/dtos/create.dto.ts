import { z } from 'zod';

export const CreateDeviceDto = z.object({
  body: z.object({
    user_id: z.string().uuid(),
    device_name: z.string().min(1).max(150),
    platform: z.string().min(1).max(50),
    browser: z.string().min(1).max(100),
    //   ip_address: z.string().regex(/^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/),
  }),
});

export type CreateDeviceDtoType = z.infer<typeof CreateDeviceDto>;
