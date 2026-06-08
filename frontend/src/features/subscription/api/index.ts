import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import { toIpcError } from "@/utils";
const BaseQuery = import.meta.env.VITE_BASE_URL;

type TrialResponse = {
    success: boolean;
    message: string;
    license: string | null;
} ;

const desktopApi = typeof window !== 'undefined' && window.api ? window.api : undefined;

const subscriptionApi = createApi({
    reducerPath: "subscriptionApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BaseQuery,
    }),
    endpoints: (builder) => ({
        // Define your endpoints here
        startFreeTrial: builder.mutation<TrialResponse, void>({
            async queryFn(_args, _api, _extraOptions): Promise<any> {
                if (desktopApi) {
                    try {
                        const result = await desktopApi.startTrial();
                        return {
                            data: {
                                success: result.success,
                                message: result.error ?? 'Free trial started successfully.',
                                license: result.license ?? null,
                            },
                        };
                    } catch (error) {
                        return {
                            error: toIpcError(error)
                        };
                    }
            }
                return {
                    error: {
                        name: 'Desktop API Unavailable',
                    },
                };
            }
        })
    }), 
});

export const { useStartFreeTrialMutation } = subscriptionApi;
export default subscriptionApi;