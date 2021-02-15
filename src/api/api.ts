import { authInterceptor as insightsAuthInterceptor } from '@redhat-cloud-services/frontend-components-utilities/esm/interceptors';
import axios, { AxiosRequestConfig } from 'axios';

export interface PagedMetaData {
  count: number;
}

export interface PagedLinks {
  first: string;
  previous: string;
  next: string;
  last: string;
}

export interface PagedResponse<D = any> {
  meta: PagedMetaData;
  links: PagedLinks;
  data: D[];
}

export function initApi({ version }: { version: string }) {
  axios.defaults.baseURL = `/api/cost-management/${version}/`;
  axios.interceptors.request.use(authInterceptor);
  axios.interceptors.request.use(insightsAuthInterceptor);
}

export function authInterceptor(reqConfig: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...reqConfig,
    headers: {
      ...reqConfig.headers,
    },
  };
}
