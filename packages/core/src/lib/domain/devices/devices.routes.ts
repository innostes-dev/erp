import {Router} from 'express';
import {createDeviceController} from './controllers/create.controller';
import {getDeviceController} from './controllers/get-device.controller';

export function deviceRouter(): Router {
    const deviceRouter = Router();
    deviceRouter.post('/create-device', createDeviceController);
    deviceRouter.get('/get-device/:device_id', getDeviceController);
    return deviceRouter;
}