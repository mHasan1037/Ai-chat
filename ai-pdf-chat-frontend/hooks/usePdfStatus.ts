import { apiRequest } from "@/lib/authClient"
import { PdfStatusResponse } from "@/types/pdf.types";
import { useQuery } from "@tanstack/react-query";

const getPdfStatus = async (chatId: string): Promise<PdfStatusResponse> =>{
    return apiRequest<PdfStatusResponse>(`/pdf-status/${chatId}`)
};

export const usePdfStatus = (chatId: string, {enabled = false}: { enabled?: boolean } = {}) =>{
    return useQuery<PdfStatusResponse>({
        queryKey: ['pdf-status', chatId],
        queryFn: () => getPdfStatus(chatId),
        enabled: !!chatId && enabled,
        refetchInterval: (query) =>{
            const status = query.state.data?.uploadStatus;
            if(status === 'ready' || status === 'failed') return false;
            return 3000;
        },
        retry: (failureCount) => failureCount < 10, 
        retryDelay: 3000,
    })
}