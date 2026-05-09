import { SetMetadata } from '@nestjs/common';

export const PUBLIC_API_KEY = 'innostes:public-api';

export const PublicApi = () => SetMetadata(PUBLIC_API_KEY, true);
